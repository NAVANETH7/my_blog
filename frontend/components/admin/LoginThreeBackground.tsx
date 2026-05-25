"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function LoginThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 10;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x7c3aed, 2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Geometry, Material, & Meshes
    const count = 80;
    const meshes: THREE.Mesh[] = [];
    const velocities: { x: number; y: number; rotX: number; rotY: number }[] = [];
    
    const colors = [0x7c3aed, 0x6d28d9, 0x4f46e5, 0x818cf8];

    for (let i = 0; i < count; i++) {
      const size = Math.random() * 0.45 + 0.15; // 0.15 to 0.6
      const geometry = new THREE.IcosahedronGeometry(size, 1);
      
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const material = new THREE.MeshBasicMaterial({
        color: randomColor,
        wireframe: true,
        transparent: true,
        opacity: Math.random() * 0.3 + 0.3, // 0.3 to 0.6
      });

      const mesh = new THREE.Mesh(geometry, material);
      
      // Position within bounds
      mesh.position.set(
        (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 6 - 3
      );

      scene.add(mesh);
      meshes.push(mesh);

      velocities.push({
        x: (Math.random() - 0.5) * 0.008,
        y: (Math.random() - 0.5) * 0.008,
        rotX: Math.random() * 0.006 + 0.002,
        rotY: Math.random() * 0.006 + 0.002,
      });
    }

    // Handle mouse move
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.targetY = (event.clientY / window.innerHeight - 0.5) * -2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Lerp mouse movement
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Parallax shift
      scene.position.x = mouseRef.current.x * 0.8;
      scene.position.y = mouseRef.current.y * 0.6;

      // Rotate & drift particles
      for (let i = 0; i < count; i++) {
        const mesh = meshes[i];
        const vel = velocities[i];

        mesh.rotation.x += vel.rotX;
        mesh.rotation.y += vel.rotY;

        mesh.position.x += vel.x;
        mesh.position.y += vel.y;

        // Wrap edges
        if (mesh.position.x > 14) mesh.position.x = -14;
        if (mesh.position.x < -14) mesh.position.x = 14;
        if (mesh.position.y > 8) mesh.position.y = -8;
        if (mesh.position.y < -8) mesh.position.y = 8;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.removeChild(renderer.domElement);
      }
      meshes.forEach(m => {
        m.geometry.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach(mat => mat.dispose());
        } else {
          m.material.dispose();
        }
      });
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-none" />;
}
