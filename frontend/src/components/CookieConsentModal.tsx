'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, MapPin, Bell, Check, Lock } from 'lucide-react';

export default function CookieConsentModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [allowLocation, setAllowLocation] = useState(true);
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(true);

  useEffect(() => {
    // Check if consent has already been granted in localStorage
    const consent = localStorage.getItem('yenfind_cookie_consent_v1');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = async () => {
    // Request actual browser geolocation if permission allowed
    if (allowLocation && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => console.log('📍 Geolocation permission granted'),
        () => console.log('📍 Geolocation permission dismissed')
      );
    }

    // Request actual browser notifications if permission allowed
    if (allowNotifications && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        await Notification.requestPermission();
      } catch {
        // Ignore
      }
    }

    localStorage.setItem(
      'yenfind_cookie_consent_v1',
      JSON.stringify({
        accepted: true,
        allowLocation,
        allowNotifications,
        allowAnalytics,
        timestamp: new Date().toISOString(),
      })
    );

    setIsVisible(false);
  };

  const handleAcceptNecessaryOnly = () => {
    localStorage.setItem(
      'yenfind_cookie_consent_v1',
      JSON.stringify({
        accepted: true,
        allowLocation: false,
        allowNotifications: false,
        allowAnalytics: false,
        timestamp: new Date().toISOString(),
      })
    );

    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header Banner */}
        <div className="p-6 bg-gradient-to-tr from-slate-950 via-slate-900 to-sky-950 text-white relative">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 mb-3 shadow-inner">
            <Cookie className="w-6 h-6 animate-bounce" />
          </div>
          <h3 className="font-extrabold text-xl sm:text-2xl tracking-tight">
            Privacy & Permissions Notice
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Welcome to <span className="text-sky-400 font-bold">Yenfind</span> (Yenepoya Campus Lost & Found). Please review the necessary permissions and cookie settings before entering the portal.
          </p>
        </div>

        {/* Permissions List */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {/* Essential Cookies */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-900">Essential Session & Auth Cookies</h4>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase">
                      Required
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Secure JWT authentication and EXIF-stripped image upload integrity.
                  </p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Check className="w-3 h-3" />
              </div>
            </div>

            {/* Geolocation Permission */}
            <div
              onClick={() => setAllowLocation(!allowLocation)}
              className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 cursor-pointer transition ${
                allowLocation
                  ? 'bg-sky-50/50 border-sky-300'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    allowLocation ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Campus GPS Geolocation</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Enables proximity radar filtering and precision pin-dropping at Yenepoya Balmatta.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={allowLocation}
                onChange={() => {}}
                className="w-4 h-4 text-sky-600 rounded mt-1 cursor-pointer"
              />
            </div>

            {/* Live Socket & Push Alerts */}
            <div
              onClick={() => setAllowNotifications(!allowNotifications)}
              className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 cursor-pointer transition ${
                allowNotifications
                  ? 'bg-sky-50/50 border-sky-300'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    allowNotifications ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Live Item Match & Handover Alerts</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Real-time Socket.io notifications when someone reports a matching lost/found belonging.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={allowNotifications}
                onChange={() => {}}
                className="w-4 h-4 text-sky-600 rounded mt-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Strict zero third-party tracker policy. EXIF GPS is automatically scrubbed.</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleAcceptAll}
              className="flex-1 py-3 px-4 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-xs font-bold rounded-2xl shadow-lg shadow-sky-600/25 transition"
            >
              Accept All & Continue
            </button>
            <button
              onClick={handleAcceptNecessaryOnly}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-2xl transition"
            >
              Essential Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
