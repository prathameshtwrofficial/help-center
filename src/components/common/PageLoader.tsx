import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Zap } from 'lucide-react';

interface PageLoaderProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  duration?: number; // Animation duration in seconds
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  text = "Loading...",
  size = 'medium',
  fullScreen = false,
  duration = 4 // Default 4 seconds
}) => {
  const sizeConfig = {
    small: {
      container: 'w-20 h-20',
      icon: 'w-10 h-10',
      text: 'text-sm',
      particleSize: 'w-1 h-1',
      orbitRadius: '40px'
    },
    medium: {
      container: 'w-32 h-32',
      icon: 'w-16 h-16',
      text: 'text-base',
      particleSize: 'w-2 h-2',
      orbitRadius: '60px'
    },
    large: {
      container: 'w-40 h-40',
      icon: 'w-20 h-20',
      text: 'text-lg',
      particleSize: 'w-3 h-3',
      orbitRadius: '80px'
    }
  };

  const config = sizeConfig[size];

  // Generate particle positions for animation with more particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i * 30) * (Math.PI / 180),
    delay: i * 0.15,
    size: Math.random() * 3 + 2
  }));

  // Enhanced floating orbs for more dynamic visual
  const floatingOrbs = Array.from({ length: 4 }, (_, i) => ({
    id: i,
    x: Math.random() * 100 - 50,
    y: Math.random() * 100 - 50,
    delay: i * 0.8,
    size: Math.random() * 8 + 4
  }));

  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-8">
      {/* Enhanced Floating Orbs Background */}
      <AnimatePresence>
        {floatingOrbs.map((orb) => (
          <motion.div
            key={`orb-${orb.id}`}
            className="absolute"
            initial={{
              opacity: 0,
              scale: 0,
              x: 0,
              y: 0
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 1.2, 0],
              x: [0, orb.x],
              y: [0, orb.y]
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: orb.delay,
              ease: "easeInOut"
            }}
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div
              className="rounded-full bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-pink-400/30 blur-sm"
              style={{
                width: `${orb.size}px`,
                height: `${orb.size}px`
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main Loader Container */}
      <div className="relative">
        {/* Enhanced Background Glow with multiple layers */}
        <motion.div
          className={`${config.container} rounded-full bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-2xl absolute`}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className={`${config.container} rounded-full bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-violet-500/20 blur-xl absolute`}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Main Container with enhanced border */}
        <motion.div
          className={`${config.container} relative flex items-center justify-center border-4 border-white/30 rounded-full backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 shadow-2xl`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {/* Central Brain Icon with enhanced animation */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
              filter: [
                'hue-rotate(0deg)',
                'hue-rotate(180deg)',
                'hue-rotate(360deg)'
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Brain className={`${config.icon} text-white drop-shadow-lg`} />
          </motion.div>

          {/* Enhanced Orbiting Particles with varied sizes and colors */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full shadow-lg"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: '50%',
                top: '50%',
                transformOrigin: '0 0',
                background: `linear-gradient(45deg,
                  hsl(${(particle.id * 30) % 360}, 70%, 60%),
                  hsl(${(particle.id * 30 + 60) % 360}, 70%, 70%)
                )`
              }}
              animate={{
                rotate: [0, 360],
                scale: [0.3, 1.2, 0.3],
                opacity: [0.2, 1, 0.2]
              }}
              transition={{
                rotate: {
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear",
                  delay: particle.delay
                },
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: particle.delay
                },
                opacity: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: particle.delay
                }
              }}
            />
          ))}

          {/* Enhanced Inner Rings */}
          <motion.div
            className="absolute inset-3 border-2 border-white/40 rounded-full"
            animate={{ rotate: -360, scale: [1, 1.1, 1] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          <motion.div
            className="absolute inset-6 border border-white/20 rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>

        {/* Enhanced Lightning Effects */}
        <AnimatePresence>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`zap-${i}`}
              className="absolute"
              initial={{
                opacity: 0,
                scale: 0,
                rotate: Math.random() * 360,
                x: (Math.random() - 0.5) * 120,
                y: (Math.random() - 0.5) * 120
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                rotate: Math.random() * 360,
                x: (Math.random() - 0.5) * 120,
                y: (Math.random() - 0.5) * 120
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut"
              }}
            >
              <Zap className="w-5 h-5 text-yellow-400 drop-shadow-lg" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Enhanced Sparkle Effects */}
        <AnimatePresence>
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute"
              initial={{
                opacity: 0,
                scale: 0,
                rotate: 0,
                x: Math.random() * 80 - 40,
                y: Math.random() * 80 - 40
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.3, 0],
                rotate: [0, 180, 360],
                x: Math.random() * 80 - 40,
                y: Math.random() * 80 - 40
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-5 h-5 text-yellow-300 drop-shadow-lg" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Enhanced Loading Text with Gradient */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <motion.p
          className={`${config.text} font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent tracking-wider`}
          animate={{
            opacity: [0.6, 1, 0.6],
            textShadow: [
              '0 0 10px rgba(255,255,255,0.3)',
              '0 0 20px rgba(255,255,255,0.5)',
              '0 0 10px rgba(255,255,255,0.3)'
            ]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {text}
        </motion.p>
        
        {/* Enhanced Animated Dots with glow */}
        <motion.div className="flex justify-center mt-3 space-x-2">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full shadow-lg"
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.4, 1, 0.4],
                boxShadow: [
                  '0 0 5px rgba(59, 130, 246, 0.5)',
                  '0 0 15px rgba(147, 51, 234, 0.8)',
                  '0 0 5px rgba(59, 130, 246, 0.5)'
                ]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Enhanced Progress Bar for Full Screen Loader */}
      {fullScreen && (
        <motion.div
          className="w-64 h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full shadow-lg"
            initial={{ width: "0%", x: "-100%" }}
            animate={{ width: "100%", x: "0%" }}
            transition={{
              duration: duration,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        className="fixed inset-0 bg-gradient-to-br from-background via-background/90 to-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.6,
            ease: "easeOut"
          }}
        >
          {loaderContent}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center justify-center py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
      >
        {loaderContent}
      </motion.div>
    </motion.div>
  );
};

export default PageLoader;