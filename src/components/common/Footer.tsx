import React from "react";
import { Link } from "react-router-dom";
import { Brain } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">BrainHints</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your comprehensive help center platform.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Learn</h3>
            <div className="space-y-2">
              <Link to="/articles" className="block text-sm text-muted-foreground hover:text-primary">
                Articles
              </Link>
              <Link to="/videos" className="block text-sm text-muted-foreground hover:text-primary">
                Videos
              </Link>
              <Link to="/faqs" className="block text-sm text-muted-foreground hover:text-primary">
                FAQs
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Support</h3>
            <div className="space-y-2">
              <Link to="/contact" className="block text-sm text-muted-foreground hover:text-primary">
                Contact Us
              </Link>
              <Link to="/feedback" className="block text-sm text-muted-foreground hover:text-primary">
                Send Feedback
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">About</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                NEURATHON-BrainHints Help Center
              </p>
              <p className="text-sm text-muted-foreground">
                © 2024 All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
