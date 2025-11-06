// set-admin-privileges.js
// This script sets admin privileges for the user

const admin = require('firebase-admin');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin SDK
initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'help-center-bc0d1'
});

async function setUserAsAdmin() {
  try {
    const userId = 'KEv4wFiSvrU3TuJ7y26TqLgx1BR2';
    
    await getAuth().setCustomUserClaims(userId, {
      admin: true
    });
    
    console.log(`✅ SUCCESS: User ${userId} is now set as admin!`);
    console.log('🎉 You can now access all admin features.');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('💡 Make sure you have Firebase Admin SDK setup correctly.');
  }
}

// Run the function
setUserAsAdmin();