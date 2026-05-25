"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dimensions
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 8;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Objects
    // 1. Torus Knot
    const geometry = new THREE.TorusKnotGeometry(2, 0.6, 120, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4f46e5, // indigo-600
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const torusKnot = new THREE.Mesh(geometry, material);
    scene.add(torusKnot);

    // 2. Floating Particles
    const particlesCount = 200;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Random position in a sphere surrounding the torus
      const r = 4 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x06b6d4, // cyan-500
      size: 0.08,
      transparent: true,
      opacity: 0.6,
    });

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleSystem);

    // Mouse responsiveness
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse positions relative to screen center
      if (typeof window !== 'undefined') {
        mouseX = (event.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
        mouseY = (event.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }

    // Animation Loop
    let animationFrameId: number;
    const startTime = Date.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = (Date.now() - startTime) / 1000;

      // Smooth target mouse rotation
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Rotate torus knot
      torusKnot.rotation.x = elapsedTime * 0.15 + targetY * 0.5;
      torusKnot.rotation.y = elapsedTime * 0.1 + targetX * 0.5;

      // Rotate particle system slowly in opposite direction
      particleSystem.rotation.y = -elapsedTime * 0.05 + targetX * 0.2;
      particleSystem.rotation.x = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-[300px] md:h-[400px] relative overflow-hidden rounded-3xl bg-radial from-slate-50/80 to-slate-100/30 dark:from-slate-900/80 dark:to-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md cursor-pointer shadow-xl hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-500 group"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-cyan-500/5 pointer-events-none" />
      <div className="absolute top-4 right-4 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 text-indigo-600 dark:text-indigo-400 select-none shadow-sm pointer-events-none group-hover:scale-105 transition-all duration-300">
        3D Visualizer
      </div>
    </div>
  );
}
