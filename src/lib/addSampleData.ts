import { firestoreService } from "./firestore";
import { Timestamp } from "firebase/firestore";

export const addSampleData = async () => {
  try {
    console.log("Adding sample data to database...");
    
    // Sample articles
    const sampleArticles = [
      {
        title: "Getting Started with Our Platform",
        content: "Welcome to our comprehensive help center! This guide will walk you through the basics of using our platform effectively. Learn about the key features, navigation, and best practices to get the most out of your experience.",
        excerpt: "Learn the basics of our platform and get started quickly.",
        category: "Getting Started",
        author: "Admin",
        tags: ["getting-started", "basics", "overview"],
        keywords: ["start", "begin", "introduction", "platform"],
        status: 'published' as const,
        readTime: "5 min read"
      },
      {
        title: "Advanced Search Techniques",
        content: "Master the art of finding exactly what you need with our powerful search features. This article covers advanced search operators, filters, and tips to help you locate information quickly and efficiently.",
        excerpt: "Discover advanced search techniques to find information faster.",
        category: "Features",
        author: "Admin",
        tags: ["search", "features", "advanced"],
        keywords: ["search", "find", "filter", "query"],
        status: 'published' as const,
        readTime: "8 min read"
      },
      {
        title: "Troubleshooting Common Issues",
        content: "Having trouble? This comprehensive guide covers the most common issues users encounter and provides step-by-step solutions to get you back on track quickly.",
        excerpt: "Quick solutions to the most common problems you might face.",
        category: "Troubleshooting",
        author: "Admin",
        tags: ["troubleshooting", "problems", "solutions"],
        keywords: ["problem", "issue", "trouble", "fix", "solution"],
        status: 'published' as const,
        readTime: "6 min read"
      }
    ];

    // Sample FAQs
    const sampleFAQs = [
      {
        question: "How do I reset my password?",
        answer: "To reset your password, click on the 'Forgot Password' link on the login page. You'll receive an email with instructions to create a new password. Make sure to check your spam folder if you don't see it in your inbox.",
        category: "Account",
        tags: ["password", "account", "login"],
        status: 'published' as const
      },
      {
        question: "Can I access the platform on mobile devices?",
        answer: "Yes! Our platform is fully responsive and works on all devices including smartphones and tablets. You can access all features through your mobile browser or by downloading our dedicated mobile app.",
        category: "General",
        tags: ["mobile", "devices", "access"],
        status: 'published' as const
      },
      {
        question: "How do I contact support?",
        answer: "You can reach our support team through multiple channels: 1) Use the help chat feature in the bottom right corner, 2) Send an email to support@brainhints.com, or 3) Submit a ticket through the support portal. We're here to help 24/7!",
        category: "Support",
        tags: ["support", "contact", "help"],
        status: 'published' as const
      }
    ];

    // Sample videos
    const sampleVideos = [
      {
        title: "Platform Overview Tour",
        description: "A comprehensive walkthrough of the main features and interface of our platform. Perfect for new users who want to get familiar with the layout and capabilities.",
        url: "https://example.com/video1",
        thumbnail: "https://example.com/thumb1.jpg",
        category: "Getting Started",
        duration: "10:30",
        tags: ["overview", "tutorial", "beginners"],
        status: 'published' as const
      },
      {
        title: "Search Tips and Tricks",
        description: "Learn how to use our search functionality effectively with these expert tips. Discover filters, operators, and strategies to find exactly what you need.",
        url: "https://example.com/video2",
        thumbnail: "https://example.com/thumb2.jpg",
        category: "Features",
        duration: "8:15",
        tags: ["search", "tips", "features"],
        status: 'published' as const
      }
    ];

    console.log("Creating articles...");
    for (const article of sampleArticles) {
      const id = await firestoreService.createArticle(article);
      console.log(`Created article: ${id}`);
    }

    console.log("Creating FAQs...");
    for (const faq of sampleFAQs) {
      const id = await firestoreService.createFAQ(faq);
      console.log(`Created FAQ: ${id}`);
    }

    console.log("Creating videos...");
    for (const video of sampleVideos) {
      const id = await firestoreService.createVideo(video);
      console.log(`Created video: ${id}`);
    }

    console.log("Sample data added successfully!");
  } catch (error) {
    console.error("Error adding sample data:", error);
    throw error;
  }
};