const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addSampleVideos() {
  try {
    console.log('🎬 Adding sample videos with Cloudinary URLs...');
    
    // Sample videos with Cloudinary URLs
    const sampleVideos = [
      {
        title: "Introduction to React Hooks",
        description: "Learn the fundamentals of React Hooks including useState, useEffect, and custom hooks.",
        url: "https://res.cloudinary.com/demo/video/upload/w_800,h_600,c_fill/sample_video.mp4",
        videoUrl: "https://res.cloudinary.com/demo/video/upload/w_800,h_600,c_fill/sample_video.mp4",
        thumbnail: "https://res.cloudinary.com/demo/video/upload/w_400,h_300,c_fill/sample_video.jpg",
        thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/w_400,h_300,c_fill/sample_video.jpg",
        category: "Technology",
        duration: "15:30",
        tags: ["React", "JavaScript", "Hooks", "Frontend"],
        keywords: ["React", "JavaScript", "Frontend", "Hooks", "useState", "useEffect"],
        author: "Admin",
        status: "published",
        views: 1250
      },
      {
        title: "Advanced CSS Grid Layouts",
        description: "Master CSS Grid with practical examples and real-world applications.",
        url: "https://res.cloudinary.com/demo/video/upload/w_800,h_600,c_fill/css_grid_tutorial.mp4",
        videoUrl: "https://res.cloudinary.com/demo/video/upload/w_800,h_600,c_fill/css_grid_tutorial.mp4",
        thumbnail: "https://res.cloudinary.com/demo/video/upload/w_400,h_300,c_fill/css_grid_thumb.jpg",
        thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/w_400,h_300,c_fill/css_grid_thumb.jpg",
        category: "Design",
        duration: "22:45",
        tags: ["CSS", "Grid", "Layout", "Design"],
        keywords: ["CSS", "Grid", "Layout", "Design", "Frontend"],
        author: "Admin",
        status: "published",
        views: 980
      },
      {
        title: "Firebase Authentication Tutorial",
        description: "Complete guide to implementing authentication in your web applications using Firebase.",
        url: "https://res.cloudinary.com/demo/video/upload/w_800,h_600,c_fill/firebase_auth_video.mp4",
        videoUrl: "https://res.cloudinary.com/demo/video/upload/w_800,h_600,c_fill/firebase_auth_video.mp4",
        thumbnail: "https://res.cloudinary.com/demo/video/upload/w_400,h_300,c_fill/firebase_auth_thumb.jpg",
        thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/w_400,h_300,c_fill/firebase_auth_thumb.jpg",
        category: "Backend",
        duration: "18:20",
        tags: ["Firebase", "Authentication", "Backend", "Security"],
        keywords: ["Firebase", "Auth", "Backend", "Security", "Login"],
        author: "Admin",
        status: "published",
        views: 1456
      },
      {
        title: "Modern JavaScript ES6+ Features",
        description: "Explore the latest JavaScript features including arrow functions, destructuring, and modules.",
        url: "https://res.cloudinary.com/demo/video/upload/w_800,h_600,c_fill/js_es6_features.mp4",
        videoUrl: "https://res.cloudinary.com/demo/video/upload/w_800,h_600,c_fill/js_es6_features.mp4",
        thumbnail: "https://res.cloudinary.com/demo/video/upload/w_400,h_300,c_fill/js_es6_thumb.jpg",
        thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/w_400,h_300,c_fill/js_es6_thumb.jpg",
        category: "Programming",
        duration: "25:15",
        tags: ["JavaScript", "ES6", "Programming", "Syntax"],
        keywords: ["JavaScript", "ES6", "Programming", "Syntax", "Arrow Functions"],
        author: "Admin",
        status: "published",
        views: 2100
      },
      {
        title: "TypeScript for Beginners",
        description: "Get started with TypeScript and learn how to add type safety to your JavaScript projects.",
        url: "https://res.cloudinary.com/demo/video/upload/w_800,h_600,c_fill/typescript_basics.mp4",
        videoUrl: "https://res.cloudinary.com/demo/video/upload/w_800,h_600,c_fill/typescript_basics.mp4",
        thumbnail: "https://res.cloudinary.com/demo/video/upload/w_400,h_300,c_fill/typescript_thumb.jpg",
        thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/w_400,h_300,c_fill/typescript_thumb.jpg",
        category: "Programming",
        duration: "20:30",
        tags: ["TypeScript", "JavaScript", "Types", "Programming"],
        keywords: ["TypeScript", "JavaScript", "Types", "Programming", "Static Types"],
        author: "Admin",
        status: "draft",
        views: 0
      }
    ];

    const now = Timestamp.now();
    
    for (const video of sampleVideos) {
      const videoData = {
        ...video,
        createdAt: now,
        updatedAt: now,
        publishedAt: video.status === 'published' ? now : undefined
      };
      
      const docRef = await addDoc(collection(db, 'videos'), videoData);
      console.log(`✅ Added video: ${video.title} (ID: ${docRef.id})`);
    }
    
    console.log(`🎉 Successfully added ${sampleVideos.length} sample videos!`);
    
    // Add some draft videos for testing
    console.log('\n📝 Adding draft videos...');
    
    const draftVideos = [
      {
        title: "Draft: Machine Learning Basics",
        description: "Introduction to machine learning concepts.",
        url: "https://res.cloudinary.com/demo/video/upload/w_800,h_600,c_fill/ml_basics.mp4",
        videoUrl: "https://res.cloudinary.com/demo/video/upload/w_800,h_600,c_fill/ml_basics.mp4",
        thumbnail: "https://res.cloudinary.com/demo/video/upload/w_400,h_300,c_fill/ml_thumb.jpg",
        thumbnailUrl: "https://res.cloudinary.com/demo/video/upload/w_400,h_300,c_fill/ml_thumb.jpg",
        category: "AI",
        duration: "30:00",
        tags: ["AI", "Machine Learning", "Python"],
        keywords: ["AI", "Machine Learning", "Python", "Data Science"],
        author: "Admin",
        status: "draft",
        views: 0
      }
    ];
    
    for (const video of draftVideos) {
      const videoData = {
        ...video,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, 'videos'), videoData);
      console.log(`📝 Added draft video: ${video.title} (ID: ${docRef.id})`);
    }
    
    console.log('✅ Sample data creation completed!');
    
  } catch (error) {
    console.error('❌ Error adding sample videos:', error);
  }
}

addSampleVideos();