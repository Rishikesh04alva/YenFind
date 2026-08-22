'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Search,
  Filter,
  Map as MapIcon,
  Grid,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  Compass,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import Header from '../components/Header';
import ItemCard from '../components/ItemCard';
import CampusMetricsBanner from '../components/CampusMetricsBanner';
import CampusLeaderboard from '../components/CampusLeaderboard';
import ReportModal from '../components/ReportModal';
import ClaimModal from '../components/ClaimModal';
import SplineScene from '../components/SplineScene';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

// Dynamic import for Leaflet map component (SSR safe)
const CampusMap = dynamic(() => import('../components/CampusMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] w-full rounded-2xl bg-slate-100 flex items-center justify-center animate-pulse border border-slate-200">
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <Compass className="w-8 h-8 animate-spin text-sky-500" />
        <span className="text-xs font-medium">Loading Interactive Campus Map...</span>
      </div>
    </div>
  ),
});

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'ELECTRONICS', label: 'Electronics' },
  { id: 'KEYS_CARDS', label: 'Keys & Cards' },
  { id: 'CLOTHING', label: 'Clothing' },
  { id: 'ACCESSORIES', label: 'Accessories' },
  { id: 'BAGS', label: 'Bags' },
  { id: 'DOCUMENTS', label: 'Documents' },
  { id: 'OTHER', label: 'Other' },
];

export default function HomePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<'MAP' | 'GRID'>('MAP');
  const [radiusFilter, setRadiusFilter] = useState<number | undefined>(undefined);

  // Modals state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportInitialType, setReportInitialType] = useState<'LOST' | 'FOUND'>('LOST');
  const [claimTargetItem, setClaimTargetItem] = useState<any | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.getItems({
        type: selectedType === 'ALL' ? undefined : selectedType,
        category: selectedCategory,
        search: searchQuery || undefined,
        lat: radiusFilter ? 12.8703 : undefined,
        lng: radiusFilter ? 74.8465 : undefined,
        radiusMeters: radiusFilter,
      });
      if (res.success && res.items) {
        setItems(res.items);
      }
    } catch (err) {
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedType, selectedCategory, radiusFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Real-time socket updates for newly posted items
  useEffect(() => {
    const socket = getSocket();
    const handleNewItem = (data: any) => {
      setItems((prev) => [data.item, ...prev]);
    };

    if (socket) {
      socket.on('new_item_posted', handleNewItem);
    }
    return () => {
      if (socket) {
        socket.off('new_item_posted', handleNewItem);
      }
    };
  }, []);

  const handleOpenReport = (type: 'LOST' | 'FOUND' = 'LOST') => {
    setReportInitialType(type);
    setIsReportOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenReportModal={handleOpenReport} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Hero Section with Interactive 3D Spline Canvas */}
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 lg:p-10 text-white shadow-2xl mb-8 overflow-hidden border border-slate-800">
          {/* Background Decorative Gradient Orbs */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Headline & Action Buttons */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-sky-300 shadow-sm">
                <Sparkles className="w-4 h-4 text-sky-400 animate-spin-slow" />
                <span>Real-Time Proximity Matchmaking & 3D Interactive Hub</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Yenfind <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
                  Campus Lost & Found Hub
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Pin lost belongings on the interactive campus map, receive real-time match alerts via WebSockets, and claim found items securely with verified .edu access.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleOpenReport('LOST')}
                  className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-red-600/30 transition-transform active:scale-95 flex items-center gap-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span>Report Lost Belonging</span>
                </button>

                <button
                  onClick={() => handleOpenReport('FOUND')}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition-transform active:scale-95 flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>I Found Something</span>
                </button>
              </div>
            </div>

            {/* Right Column: 3D Interactive Spline Scene */}
            <div className="lg:col-span-5 h-[320px] sm:h-[380px] lg:h-[420px] w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 shadow-2xl relative">
              <SplineScene
                sceneUrl="https://prod.spline.design/A57HB-SrUlLLPWuS/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Live Campus Recovery Metrics */}
        <CampusMetricsBanner />

        {/* Real-time Top 10 Leaderboard with Special Mention for Top 3 */}
        <CampusLeaderboard />

        {/* Search & Filter Controls */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 sm:p-5 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search lost items by keyword, location, or brand (e.g. 'AirPods', 'Library', 'Patagonia')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="p-1 rounded-xl bg-slate-100 flex items-center">
                <button
                  onClick={() => setViewMode('MAP')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === 'MAP'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5 text-sky-600" />
                  <span>Campus Map</span>
                </button>
                <button
                  onClick={() => setViewMode('GRID')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === 'GRID'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Grid Cards</span>
                </button>
              </div>

              <button
                onClick={fetchItems}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                title="Refresh Items"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            {/* Type Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold uppercase text-[10px] mr-1">Type:</span>
              {(['ALL', 'LOST', 'FOUND'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    selectedType === t
                      ? t === 'LOST'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : t === 'FOUND'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === 'ALL' ? 'All Reports' : t}
                </button>
              ))}
            </div>

            {/* Category Dropdown & Radius */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>

              {/* Radius Filter */}
              <select
                value={radiusFilter || ''}
                onChange={(e) =>
                  setRadiusFilter(e.target.value ? Number(e.target.value) : undefined)
                }
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Campus Wide (All)</option>
                <option value="300">Within 300m of Center</option>
                <option value="600">Within 600m of Center</option>
                <option value="1200">Within 1.2km</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Content: Interactive Map vs Grid */}
        {viewMode === 'MAP' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-sky-600" />
                <span>Live Campus Map View ({items.length} Pins)</span>
              </h2>
              <span className="text-xs text-slate-500">
                Click any pin to inspect item & claim ownership
              </span>
            </div>

            <CampusMap
              items={items}
              radiusMeters={radiusFilter}
              height="560px"
            />

            {/* Quick List Below Map */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  Registered Incident Reports ({items.length})
                </h3>
              </div>

              {items.length === 0 ? (
                <div className="py-12 px-6 text-center rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                    <MapIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">No Unclaimed Incidents Registered Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                    The Yenepoya campus board is clean! If you have misplaced an item or found something on campus, register it below.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReport('LOST')}
                      className="px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs border border-red-200 transition"
                    >
                      Report Lost
                    </button>
                    <button
                      onClick={() => handleOpenReport('FOUND')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      Register Found Item
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.slice(0, 6).map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onClaim={(target) => setClaimTargetItem(target)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Grid className="w-5 h-5 text-indigo-600" />
                <span>All Registered Incident Reports ({items.length})</span>
              </h2>
            </div>

            {items.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-white border border-slate-200 p-8 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <Grid className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">No Registered Reports Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                  No active lost or found reports match your current filters.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenReport('LOST')}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs shadow transition"
                  >
                    Report Lost
                  </button>
                  <button
                    onClick={() => handleOpenReport('FOUND')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow transition"
                  >
                    Report Found
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onClaim={(target) => setClaimTargetItem(target)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        initialType={reportInitialType}
        onItemCreated={fetchItems}
      />

      <ClaimModal
        item={claimTargetItem}
        isOpen={!!claimTargetItem}
        onClose={() => setClaimTargetItem(null)}
        onClaimSubmitted={fetchItems}
      />
    </div>
  );
}
