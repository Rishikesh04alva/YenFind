'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Bell,
  PlusCircle,
  LogOut,
  User,
  Sparkles,
  Phone,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import ContactModal from './ContactModal';

interface HeaderProps {
  onOpenReportModal: (type?: 'LOST' | 'FOUND') => void;
}

export default function Header({ onOpenReportModal }: HeaderProps) {
  const { user, logout, openAuthModal } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
        const unread = res.notifications.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Listen to incoming match alerts via socket
  useEffect(() => {
    const socket = getSocket();
    const handleMatchAlert = (data: any) => {
      setNotifications((prev) => [data.notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    if (socket) {
      socket.on('match_alert', handleMatchAlert);
    }
    return () => {
      if (socket) {
        socket.off('match_alert', handleMatchAlert);
      }
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg bg-gradient-to-r from-slate-900 via-sky-900 to-indigo-900 bg-clip-text text-transparent">
                Yenfind
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-wider px-2.5 py-0.5 bg-gradient-to-r from-sky-50 to-indigo-50 text-indigo-700 rounded-full border border-indigo-200/80 shadow-sm">
                ✨ Made by Rishikesh
              </span>
            </div>
          </Link>

          {/* Action Controls & Navigation */}
          <div className="flex items-center gap-2.5">
            {/* Quick Report Actions */}
            <button
              onClick={() => onOpenReportModal('LOST')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Report Lost
            </button>

            <button
              onClick={() => onOpenReportModal('FOUND')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">I Found Something</span>
              <span className="sm:hidden">Found</span>
            </button>

            {/* Contact Button */}
            <button
              onClick={() => setIsContactOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
            >
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              <span>Contact</span>
            </button>

            {/* Real-Time Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                  title="Real-Time Match Alerts"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce-subtle">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-sky-600" />
                        <h4 className="font-bold text-sm text-slate-900">Live Match Alerts</h4>
                      </div>
                      <span className="text-[11px] text-slate-500">{notifications.length} alerts</span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No match notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkAsRead(n.id)}
                            className={`p-3.5 hover:bg-slate-50 cursor-pointer transition flex items-start gap-3 ${
                              !n.isRead ? 'bg-sky-50/50' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700">
                                  {n.matchScore}%
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 leading-snug">{n.message}</p>
                              <span className="text-[10px] text-slate-400 block mt-1">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Separate Sign In Button / User Profile State with Points Badge */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {/* Gamified Points Badge Beside Profile */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold text-xs shadow-md shadow-amber-500/20"
                  title={`${user.points || 0} Campus Karma Points (${user.itemsReturned || 0} Items Returned)`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-100 animate-pulse" />
                  <span>{user.points || 0}</span>
                  <span className="text-[10px] font-bold text-amber-100 uppercase tracking-wide">pts</span>
                </div>

                <div className="hidden lg:block text-right">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-emerald-600 font-medium truncate max-w-[140px]">
                    ✓ {user.email}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Info badge explaining reward points */}
                <div
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-extrabold shadow-sm"
                  title="Earn +100 Campus Points for each item returned!"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>+100 pts per return</span>
                </div>

                <button
                  onClick={openAuthModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Dedicated Contact Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </>
  );
}
