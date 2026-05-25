"use client";

import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setCompletion((window.scrollY / scrollHeight) * 100);
      } else {
        setCompletion(0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Run initial scroll check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-slate-100/50 dark:bg-slate-800/30 z-[100] pointer-events-none select-none">
      <div
        className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 transition-all duration-75 ease-out"
        style={{ width: `${completion}%` }}
      />
    </div>
  );
}
