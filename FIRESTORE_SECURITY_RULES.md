# Firebase Firestore Security Rules

## Articles Collection Rules

Copy and paste these rules into your Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Articles Collection Rules
    match /articles/{articleId} {
      
      // Allow read access to published articles for all users
      allow read: if resource.data.published == true;
      
      // Allow all operations for authenticated admin users
      allow read, write, update, delete: if request.auth != null && 
        request.auth.token.admin == true;
      
      // Allow creation of draft articles for authenticated users
      allow create: if request.auth != null && 
        request.resource.data.published == false;
      
      // Allow updates to articles (draft/published state changes)
      allow update: if request.auth != null;
      
      // Allow deletion only by admin users
      allow delete: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Other collections (examples)
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    match /faqs/{faqId} {
      // Public read access
      allow read: if true;
      // Admin only write access
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    match /videos/{videoId} {
      // Public read access to published videos
      allow read: if resource.data.published == true;
      // Admin only write access
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    match /feedback/{feedbackId} {
      // Allow users to create feedback
      allow create: if request.auth != null;
      // Admin only read/write for feedback management
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
```

## User Token Configuration

To set admin privileges, you can either:

### Option 1: Custom Claims (Recommended)
```javascript
// Set admin claims via Admin SDK
admin.auth().setCustomUserClaims(uid, { admin: true });
```

### Option 2: Firestore User Document
```javascript
// Create a users collection with admin status
match /users/{userId} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true;
}
```

## Important Notes:

1. **Replace `{database}`** with your actual database name if using multi-database setup
2. **Admin tokens**: Make sure your admin users have the `admin: true` custom claim
3. **Testing**: Always test your rules before deploying to production
4. **Indexes**: Some queries may require Firestore composite indexes

## To set up admin users:

1. Go to Firebase Console → Authentication → Users
2. Copy the UID of your admin user
3. Run this in your Firebase project (using Admin SDK or Cloud Functions):

```javascript
admin.auth().setCustomUserClaims('USER_UID_HERE', { 
  admin: true 
});