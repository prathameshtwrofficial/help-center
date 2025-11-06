import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AnimationContextType {
  animationsEnabled: boolean;
  threeDEnabled: boolean;
  toggleAnimations: () => void;
  toggle3D: () => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

interface AnimationProviderProps {
  children: ReactNode;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [threeDEnabled, setThreeDEnabled] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    const savedAnimations = localStorage.getItem('animations-enabled');
    const saved3D = localStorage.getItem('3d-enabled');

    if (savedAnimations !== null) {
      setAnimationsEnabled(savedAnimations === 'true');
    }

    if (saved3D !== null) {
      setThreeDEnabled(saved3D === 'true');
    }

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setAnimationsEnabled(false);
      setThreeDEnabled(false);
    }
  }, []);

  const toggleAnimations = () => {
    const newValue = !animationsEnabled;
    setAnimationsEnabled(newValue);
    localStorage.setItem('animations-enabled', newValue.toString());
  };

  const toggle3D = () => {
    const newValue = !threeDEnabled;
    setThreeDEnabled(newValue);
    localStorage.setItem('3d-enabled', newValue.toString());
  };

  return (
    <AnimationContext.Provider
      value={{
        animationsEnabled,
        threeDEnabled,
        toggleAnimations,
        toggle3D,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};