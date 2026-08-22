'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Compass } from 'lucide-react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          url: string;
          'events-target'?: string;
          loading?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface SplineSceneProps {
  sceneUrl?: string;
  className?: string;
}

export default function SplineScene({
  sceneUrl = 'https://prod.spline.design/A57HB-SrUlLLPWuS/scene.splinecode',
  className = 'w-full h-full min-h-[380px]',
}: SplineSceneProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if spline-viewer is already defined in customElements
    if (typeof window !== 'undefined' && customElements.get('spline-viewer')) {
      setScriptLoaded(true);
      return;
    }

    // Dynamic script injection to ensure reliable global registration
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@splinetool/viewer@1.9.28/build/spline-viewer.js';
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Keep in DOM
    };
  }, []);

  return (
    <div className={`relative rounded-3xl overflow-hidden w-full h-full min-h-[380px] bg-slate-950 flex items-center justify-center ${className}`}>
      {/* High-Visibility Glowing Purple 'Found it!' Centerpiece Overlay & Backdrop */}
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none z-0">
        <span className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-purple-400 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(192,132,252,0.8)] animate-pulse">
          Found it!
        </span>
        <span className="text-xs font-extrabold uppercase tracking-widest text-purple-300/80 mt-1 drop-shadow-md">
          Campus Lost & Found 3D
        </span>
      </div>

      {/* 3D Spline Web Component Direct Render */}
      {scriptLoaded ? (
        <spline-viewer
          url={sceneUrl}
          loading="eager"
          events-target="global"
          style={{
            width: '100%',
            height: '100%',
            minHeight: '380px',
            display: 'block',
            position: 'relative',
            zIndex: 10,
          }}
        />
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center text-purple-400 gap-2 p-6 animate-pulse">
          <Compass className="w-10 h-10 animate-spin text-purple-400" />
          <span className="text-xs text-purple-200 font-medium">Initializing 3D Canvas...</span>
        </div>
      )}

      {/* Floating 3D Badge */}
      <div className="absolute top-3 right-3 z-20 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/90 backdrop-blur-md border border-purple-400/40 text-[10px] font-bold text-purple-300 shadow-xl shadow-purple-900/50">
          <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
          <span>Interactive 3D</span>
        </span>
      </div>
    </div>
  );
}
