import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Octahedron } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingShapesProps {
  className?: string;
}

const AnimatedShape: React.FC<{ position: [number, number, number]; shape: 'box' | 'sphere' | 'octahedron' }> = ({ position, shape }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.5;
    }
  });

  const renderShape = () => {
    switch (shape) {
      case 'box':
        return <Box args={[0.5, 0.5, 0.5]} />;
      case 'sphere':
        return <Sphere args={[0.3, 16, 16]} />;
      case 'octahedron':
        return <Octahedron args={[0.4]} />;
      default:
        return <Box args={[0.5, 0.5, 0.5]} />;
    }
  };

  return (
    <mesh ref={meshRef} position={position}>
      {renderShape()}
      <meshStandardMaterial
        color="#F97316"
        transparent
        opacity={0.7}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
};

const FloatingShapes: React.FC<FloatingShapesProps> = ({ className = '' }) => {
  const shapes = useMemo(() => [
    { position: [-3, 2, -2] as [number, number, number], shape: 'box' as const },
    { position: [3, -1, -3] as [number, number, number], shape: 'sphere' as const },
    { position: [-2, -2, 2] as [number, number, number], shape: 'octahedron' as const },
    { position: [2, 3, 1] as [number, number, number], shape: 'box' as const },
    { position: [0, -3, -1] as [number, number, number], shape: 'sphere' as const },
  ], []);

  return (
    <div className={`absolute inset-0 -z-10 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#4F46E5" />

        {shapes.map((shape, index) => (
          <AnimatedShape key={index} position={shape.position} shape={shape.shape} />
        ))}

        <fog attach="fog" args={['#0f172a', 8, 20]} />
      </Canvas>
    </div>
  );
};

export default FloatingShapes;