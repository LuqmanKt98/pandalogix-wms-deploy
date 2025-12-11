/**
 * Script to reset admin user password
 * Run with: node scripts/reset-admin-password.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../warehouse-management-sys-3fdf3-firebase-adminsdk-fbsvc-19f4e046d6.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "warehouse-management-sys-3fdf3.firebasestorage.app"
});

const auth = admin.auth();

async function resetPassword() {
  const email = 'admin@pandalogix.com';
  const newPassword = 'Admin123!';

  try {
    console.log('Resetting password for:', email);
    
    // Get user by email
    const user = await auth.getUserByEmail(email);
    
    // Update password
    await auth.updateUser(user.uid, {
      password: newPassword
    });

    console.log('✓ Password reset successfully');
    console.log('\n=== Login Credentials ===');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    console.log('\nYou can now login with these credentials.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword();

