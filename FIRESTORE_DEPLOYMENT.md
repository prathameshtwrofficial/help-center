# Firestore Rules Deployment Instructions

## Overview
This document explains how to deploy the Firestore security rules for the Help Center application.

## Current Setup
- **Firestore Database**: `help-center-bc0d1` 
- **Rules File**: `firestore.rules`
- **Development Mode**: Currently allows all operations for testing

## How to Deploy Firestore Rules

### Prerequisites
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase project: `firebase init firestore`

### Steps to Deploy Rules

1. **Navigate to project directory**:
   ```bash
   cd NEURATHON-BrainHints
   ```

2. **Deploy Firestore rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Verify deployment**:
   Check the Firebase Console > Firestore Database > Rules

## Security Rules Details

### Current Development Rules
The current `firestore.rules` file allows all operations for development:
- ✅ Read access to all articles
- ✅ Create, update, delete for all articles
- ✅ Same permissions for videos, FAQs, and feedback

### Production Rules (Recommended)
For production, use stricter rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /articles/{articleId} {
      allow read: if resource.data.status == 'published';
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Permission Denied Errors
If you see "missing or insufficient permission" errors:
1. Check that rules are deployed: `firebase firestore:rules:test`
2. Verify user authentication status
3. Clear browser cache and try again

### Testing Rules
Test rules locally:
```bash
firebase emulators:start --only firestore
```

## Next Steps
1. Deploy rules using Firebase CLI
2. Test article creation and publishing
3. Consider implementing Firebase Authentication for production security

## Support
For issues with Firestore rules:
- Firebase Documentation: https://firebase.google.com/docs/rules
- Console: https://console.firebase.google.com/project/help-center-bc0d1/firestore/rules