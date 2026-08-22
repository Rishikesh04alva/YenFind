'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, X, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getSocket } from '../lib/socket';

export default function MatchToast() {
  const [activeAlert, setActiveAlert] = useState<any | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleMatch = (payload: any) => {
      console.log('⚡ Real-time match alert received:', payload);
      setActiveAlert(payload);

      // Auto-dismiss after 9 seconds
      const timer = setTimeout(() => {
        setActiveAlert(null);
      }, 9000);

      return () => clearTimeout(timer);
    };

    if (socket) {
      socket.on('match_alert', handleMatch);
    }
    return () => {
      if (socket) {
        socket.off('match_alert', handleMatch);
      }
    };
  }, []);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-[9999] max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-sky-500/50 relative overflow-hidden backdrop-blur-xl">
        {/* Glowing Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/30 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-sky-400 uppercase tracking-wider">
                  Live Match Detected
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-500/30 text-sky-200 border border-sky-400/40">
                  {activeAlert.score}% Match
                </span>
              </div>
              <h4 className="font-bold text-sm text-white line-clamp-1 mt-0.5">
                {activeAlert.newItem?.title}
              </h4>
            </div>
          </div>

          <button
            onClick={() => setActiveAlert(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mt-2.5 leading-relaxed relative z-10">
          {activeAlert.notification?.message ||
            `A recently reported item closely matches keywords and coordinates (${activeAlert.distanceMeters || 30}m away).`}
        </p>

        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span className="truncate max-w-[180px]">
              {activeAlert.newItem?.locationName || 'Campus area'}
            </span>
          </div>

          <Link
            href={`/items/${activeAlert.newItem?.id}`}
            onClick={() => setActiveAlert(null)}
            className="flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 transition"
          >
            <span>Inspect Match</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
