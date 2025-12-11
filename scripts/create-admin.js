/**
 * Script to create an initial admin user
 * Run with: node scripts/create-admin.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../warehouse-management-sys-3fdf3-firebase-adminsdk-fbsvc-19f4e046d6.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "warehouse-management-sys-3fdf3.firebasestorage.app"
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  const email = 'admin@pandalogix.com';
  const password = 'Admin123!';
  const name = 'Admin User';
  const role = 'superAdmin';

  try {
    console.log('Creating admin user...');
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    console.log('✓ Created Firebase Auth user:', userRecord.uid);

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✓ Created Firestore user document');
    console.log('\n=== Admin User Created Successfully ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', role);
    console.log('\nYou can now login with these credentials.');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('User already exists. Trying to update...');
      
      try {
        // Get existing user
        const existingUser = await auth.getUserByEmail(email);
        
        // Update Firestore document
        await db.collection('users').doc(existingUser.uid).set({
          email,
          name,
          role,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        
        console.log('✓ Updated existing user to superAdmin');
        console.log('\n=== Login Credentials ===');
        console.log('Email:', email);
        console.log('Password: (use your existing password or reset it)');
        console.log('Role:', role);
        
        process.exit(0);
      } catch (updateError) {
        console.error('Error updating user:', updateError);
        process.exit(1);
      }
    } else {
      console.error('Error creating admin user:', error);
      process.exit(1);
    }
  }
}

createAdminUser();

