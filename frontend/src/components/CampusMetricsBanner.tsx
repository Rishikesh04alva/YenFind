'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, Search, Zap, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';

export default function CampusMetricsBanner() {
  const [stats, setStats] = useState({
    totalLost: 0,
    totalFound: 0,
    totalResolved: 0,
    totalUsers: 0,
    recoveryRate: 82,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getStats();
        if (res.success && res.stats) {
          setStats(res.stats);
        }
      } catch {
        // Fallback
      }
    }
    loadStats();
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {/* Stat 1 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
          <Search className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Lost</p>
          <h4 className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalLost}</h4>
        </div>
      </div>

      {/* Stat 2 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Found & Safe</p>
          <h4 className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalFound}</h4>
        </div>
      </div>

      {/* Stat 3 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved Claims</p>
          <h4 className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.totalResolved}</h4>
        </div>
      </div>

      {/* Stat 4 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-tr from-slate-900 to-sky-950 text-white shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-sky-300 uppercase tracking-wider">Recovery Rate</p>
          <h4 className="text-2xl font-extrabold text-white mt-0.5">{stats.recoveryRate}%</h4>
        </div>
      </div>
    </div>
  );
}
