// Firebase Cloud Function to set admin privileges
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Call this function to set admin privileges
exports.setAdminPrivileges = functions.https.onRequest(async (req, res) => {
  try {
    const userId = 'KEv4wFiSvrU3TuJ7y26TqLgx1BR2';
    
    await admin.auth().setCustomUserClaims(userId, {
      admin: true
    });
    
    res.json({
      success: true,
      message: `User ${userId} is now admin!`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});