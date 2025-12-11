/**
 * Admin User Management API Routes
 * 
 * These routes use Firebase Admin SDK for privileged operations
 * that cannot be performed with client-side Firebase SDK.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Verify the requesting user is admin or superAdmin
async function verifyAdminAccess(request: NextRequest): Promise<{ authorized: boolean; userId?: string; role?: string; isSuperAdmin?: boolean }> {
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
 * GET /api/admin/users
 * Get all users (for admin/superAdmin only)
 */
export async function GET(request: NextRequest) {
  const { authorized } = await verifyAdminAccess(request);

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const usersSnapshot = await adminDb.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Failed to get users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Create a new user with Firebase Auth + Firestore document
 */
export async function POST(request: NextRequest) {
  const { authorized, isSuperAdmin } = await verifyAdminAccess(request);

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, password, name, role = 'staff' } = body;

    // Security check: Only Super Admin can create a Super Admin
    if (role === 'superAdmin' && !isSuperAdmin) {
      return NextResponse.json({ error: 'Only Super Admins can create Super Admin accounts' }, { status: 403 });
    }

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Create user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      user: { id: userRecord.uid, email, name, role }
    });
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

