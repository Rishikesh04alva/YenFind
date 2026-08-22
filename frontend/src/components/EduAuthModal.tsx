'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Lock, AlertCircle, CheckCircle2, School } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EduAuthModal() {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const trimmed = email.trim().toLowerCase();
  const isEduDomain = trimmed.endsWith('.edu') || trimmed.endsWith('.edu.in');

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!isEduDomain) {
      setError('Access Restricted: You must enter a valid university .edu or .edu.in email address.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await login(email, name, 'Yenepoya School of Engineering & Technology');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-tr from-slate-950 via-slate-900 to-sky-950 text-white relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 mb-3 shadow-inner">
            <School className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-xl">Campus SSO Sign In</h3>
          <p className="text-xs text-slate-300 mt-1">
            Access strictly restricted to verified <span className="font-bold text-sky-300">.edu / .edu.in</span> institutional accounts.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Campus Email Sign In Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>University / Campus Email</span>
                {email && (
                  <span
                    className={`text-[10px] font-bold flex items-center gap-1 ${
                      isEduDomain ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {isEduDomain ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Valid .edu / .edu.in
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        Must end in .edu or .edu.in
                      </>
                    )}
                  </span>
                )}
              </label>
              <input
                type="email"
                required
                placeholder="e.g. name@yenepoya.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Enter your official institution email to receive live match notifications & coordinate item recovery.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isEduDomain || !name.trim()}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? 'Authenticating...' : 'Sign In with Campus Email'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
