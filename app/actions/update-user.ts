'use server'

import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { revalidatePath } from 'next/cache'

export async function updateUserEmailServer(userId: string, newEmail: string) {
    try {
        // Update email in Firebase Auth using Admin SDK
        await adminAuth.updateUser(userId, {
            email: newEmail,
            emailVerified: true, // Skip verification
        })

        // Update email in Firestore
        await adminDb.collection('users').doc(userId).update({
            email: newEmail,
            updatedAt: new Date(),
        })

        revalidatePath('/settings')
        
        return { success: true }
    } catch (error: any) {
        console.error('Error updating email:', error)
        return { 
            success: false, 
            error: error.message || 'Failed to update email' 
        }
    }
}

