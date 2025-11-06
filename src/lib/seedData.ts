import { firestoreService } from "./firestore";
import { Timestamp } from "firebase/firestore";

export const seedData = {
  articles: [
    {
      title: "Getting Started with BrainHints",
      content: "Welcome to BrainHints! This comprehensive guide will help you get started with our platform. BrainHints is designed to provide you with the best learning and support experience through articles, videos, and FAQs.",
      excerpt: "Learn how to get started with BrainHints and make the most of our platform.",
      category: "Getting Started",
      author: "Admin",
      tags: ["introduction", "guide", "start"],
      keywords: ["getting started", "brainhints", "help", "guide"],
      status: "published" as const,
      readTime: "5 min read",
      views: 45
    },
    {
      title: "Advanced Features and Tools",
      content: "Explore the advanced features that BrainHints offers to enhance your learning experience. From interactive tutorials to personalized recommendations, learn how to leverage our tools for maximum productivity.",
      excerpt: "Discover the powerful features that make BrainHints stand out from other platforms.",
      category: "Features",
      author: "Admin",
      tags: ["features", "advanced", "tools"],
      keywords: ["features", "advanced", "tools", "productivity"],
      status: "published" as const,
      readTime: "8 min read",
      views: 23
    },
    {
      title: "Troubleshooting Common Issues",
      content: "Having trouble with BrainHints? This article covers the most common issues users face and provides step-by-step solutions to get you back on track quickly and efficiently.",
      excerpt: "Find solutions to the most common issues you might encounter while using BrainHints.",
      category: "Troubleshooting",
      author: "Admin",
      tags: ["troubleshooting", "help", "solutions"],
      keywords: ["troubleshooting", "help", "issues", "solutions"],
      status: "published" as const,
      readTime: "6 min read",
      views: 67
    }
  ],
  videos: [
    {
      title: "BrainHints Platform Overview",
      description: "A comprehensive walkthrough of the BrainHints platform, covering all the key features and how to navigate the interface effectively.",
      url: "https://example.com/video1",
      category: "Getting Started",
      duration: "5:30",
      tags: ["overview", "tutorial", "beginner"],
      status: "published" as const,
      views: 134
    },
    {
      title: "Advanced Search Techniques",
      description: "Learn how to use the advanced search features to find exactly what you need quickly and efficiently.",
      url: "https://example.com/video2", 
      category: "Features",
      duration: "7:15",
      tags: ["search", "advanced", "tutorial"],
      status: "published" as const,
      views: 89
    },
    {
      title: "Quick Tips and Tricks",
      description: "Discover some handy tips and tricks to make your experience with BrainHints even better.",
      url: "https://example.com/video3",
      category: "Tips",
      duration: "3:45", 
      tags: ["tips", "tricks", "productivity"],
      status: "published" as const,
      views: 156
    }
  ],
  faqs: [
    {
      question: "How do I create an account?",
      answer: "Creating an account is simple! Click on the 'Sign Up' button in the top right corner, fill in your details, and verify your email address. You'll be ready to explore BrainHints in minutes.",
      category: "Account",
      tags: ["account", "signup", "registration"],
      status: "published" as const,
      views: 78
    },
    {
      question: "Can I access BrainHints on mobile devices?",
      answer: "Yes! BrainHints is fully responsive and works perfectly on all mobile devices, tablets, and desktop computers. Your progress syncs automatically across all your devices.",
      category: "Technical",
      tags: ["mobile", "responsive", "devices"],
      status: "published" as const,
      views: 45
    },
    {
      question: "How do I reset my password?",
      answer: "If you've forgotten your password, click on 'Forgot Password' on the login page. Enter your email address, and we'll send you a secure link to reset your password.",
      category: "Account",
      tags: ["password", "reset", "security"],
      status: "published" as const,
      views: 92
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely! We use industry-standard encryption and security measures to protect your data. Your information is never shared with third parties, and you have full control over your account settings.",
      category: "Security",
      tags: ["security", "privacy", "data"],
      status: "published" as const,
      views: 67
    }
  ]
};

export const addSampleData = async () => {
  try {
    console.log("Adding sample data to database...");
    
    // Add sample articles
    for (const article of seedData.articles) {
      await firestoreService.createArticle(article);
    }
    
    // Add sample videos
    for (const video of seedData.videos) {
      await firestoreService.createVideo(video);
    }
    
    // Add sample FAQs
    for (const faq of seedData.faqs) {
      await firestoreService.createFAQ(faq);
    }
    
    console.log("Sample data added successfully!");
    return true;
  } catch (error) {
    console.error("Error adding sample data:", error);
    throw error;
  }
};