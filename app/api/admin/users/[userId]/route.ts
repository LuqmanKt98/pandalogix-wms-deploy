/**
 * Admin User Management API Routes - Individual User Operations
 * 
 * DELETE /api/admin/users/[userId] - Delete a user (requires admin privileges)
 * PATCH /api/admin/users/[userId] - Update user role (requires admin privileges)
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Verify the requesting user is admin or superAdmin
async function verifyAdminAccess(request: NextRequest): Promise<{
  authorized: boolean;
  userId?: string;
  role?: string;
  isSuperAdmin?: boolean;
}> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false };
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get user role from Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return { authorized: false };
    }

    const userData = userDoc.data();
    const role = userData?.role;

    if (role === 'superAdmin' || role === 'admin') {
      return { authorized: true, userId, role, isSuperAdmin: role === 'superAdmin' };
    }

    return { authorized: false };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { authorized: false };
  }
}

/**
 * GET /api/admin/users/[userId]
 * Get a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { authorized } = await verifyAdminAccess(request);

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: { id: userDoc.id, ...userDoc.data() } });
  } catch (error: any) {
    console.error('Failed to get user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users/[userId]
 * Update a user's role or other properties
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: targetUserId } = await params;
  const { authorized, userId: requestingUserId, isSuperAdmin } = await verifyAdminAccess(request);

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { role, name } = body;

    // Get target user to check if they're a superAdmin
    const targetUserDoc = await adminDb.collection('users').doc(targetUserId).get();

    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUserData = targetUserDoc.data();

    // Security Checks: Prevent unauthorized privilege escalation or modification of high-privilege accounts
    const targetIsSuperAdmin = targetUserData?.role === 'superAdmin';
    const attemptingToSetSuperAdmin = role === 'superAdmin';

    // 1. Only Super Admins can modify other Super Admins
    if (targetIsSuperAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only Super Admins can modify Super Admin accounts' },
        { status: 403 }
      );
    }

    // 2. Only Super Admins can assign the Super Admin role
    if (attemptingToSetSuperAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only Super Admins can assign the Super Admin role' },
        { status: 403 }
      );
    }

    // 3. Admin cannot modify Admin accounts
    if (targetUserData?.role === 'admin' && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only Super Admins can modify Admin accounts' },
        { status: 403 }
      );
    }

    // 4. Admin cannot assign the Admin role
    if (role === 'admin' && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only Super Admins can assign the Admin role' },
        { status: 403 }
      );
    }

    // Validate role if provided
    if (role && !['staff', 'admin', 'superAdmin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be staff, admin, or superAdmin' },
        { status: 400 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    if (role) updateData.role = role;
    if (name) updateData.name = name;

    await adminDb.collection('users').doc(targetUserId).update(updateData);

    // Update display name in Firebase Auth if name changed
    if (name) {
      await adminAuth.updateUser(targetUserId, { displayName: name });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Delete a user from both Firebase Auth and Firestore
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: targetUserId } = await params;
  const { authorized, userId: requestingUserId, isSuperAdmin } = await verifyAdminAccess(request);

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Prevent self-deletion
  if (targetUserId === requestingUserId) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 403 });
  }

  try {
    // Check if target user is a superAdmin
    const targetUserDoc = await adminDb.collection('users').doc(targetUserId).get();

    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUserData = targetUserDoc.data();

    // 1. Only Super Admins can delete Super Admins
    if (targetUserData?.role === 'superAdmin') {
      return NextResponse.json({ error: 'Cannot delete superAdmin users' }, { status: 403 });
    }

    // 2. Only Super Admins can delete Admins
    if (targetUserData?.role === 'admin' && !isSuperAdmin) {
      return NextResponse.json({ error: 'Only Super Admins can delete Admin accounts' }, { status: 403 });
    }

    // Delete from Firestore first
    await adminDb.collection('users').doc(targetUserId).delete();

    // Delete from Firebase Auth
    await adminAuth.deleteUser(targetUserId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

