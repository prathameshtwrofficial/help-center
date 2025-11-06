import React from "react";
import { X } from "lucide-react";
import Auth from "@/pages/Auth";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthDialog({ isOpen, onClose }: AuthDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-sm bg-background rounded-lg shadow-2xl border border-border overflow-hidden">
        <Auth isModal={true} onClose={onClose} />
      </div>
    </div>
  );
}