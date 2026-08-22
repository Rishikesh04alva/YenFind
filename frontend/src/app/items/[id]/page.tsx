'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  User,
  Send,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  QrCode,
  Sparkles,
  Award,
} from 'lucide-react';
import Header from '../../../components/Header';
import ClaimModal from '../../../components/ClaimModal';
import ReportModal from '../../../components/ReportModal';
import HandoverQRModal from '../../../components/HandoverQRModal';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { joinItemRoom, leaveItemRoom, getSocket } from '../../../lib/socket';

const CampusMap = dynamic(() => import('../../../components/CampusMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />,
});

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user, openAuthModal, refreshUser } = useAuth();

  const [item, setItem] = useState<any | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const fetchItemData = async () => {
    if (!id) return;
    try {
      const res = await api.getItemById(id);
      if (res.success && res.item) {
        setItem(res.item);
        setIsOwner(res.isOwner || false);
        setMessages(res.item.messages || []);
      }
    } catch (err) {
      console.error('Error fetching item details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemData();
    joinItemRoom(id);

    const socket = getSocket();
    const handleNewMessage = (msg: any) => {
      if (msg.itemId === id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleStatusUpdated = (data: any) => {
      if (data.itemId === id) {
        setItem((prev: any) => (prev ? { ...prev, status: data.status } : prev));
        refreshUser();
      }
    };

    if (socket) {
      socket.on('new_chat_message', handleNewMessage);
      socket.on('item_status_updated', handleStatusUpdated);
    }

    return () => {
      leaveItemRoom(id);
      if (socket) {
        socket.off('new_chat_message', handleNewMessage);
        socket.off('item_status_updated', handleStatusUpdated);
      }
    };
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    if (!newMessageText.trim()) return;

    try {
      const res = await api.sendMessage(id, newMessageText.trim());
      if (res.success && res.message) {
        setNewMessageText('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await api.updateItemStatus(id, status);
      fetchItemData();
      refreshUser();
    } catch (err: any) {
      alert(err.message || 'Failed to update item status.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-semibold text-slate-500 animate-pulse">
          Loading verified incident report...
        </p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-800">Incident Report Not Found</h2>
        <Link
          href="/"
          className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
        >
          Return to Campus Map
        </Link>
      </div>
    );
  }

  const isLost = item.type === 'LOST';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onOpenReportModal={() => setIsReportOpen(true)} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Campus Map</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Item Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6 sm:p-8">
              {/* Type Badge & Meta */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                      isLost
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    {item.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span
                    className={`px-3 py-1 rounded-full ${
                      item.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : item.status === 'CLAIMED'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-sky-100 text-sky-800 border border-sky-200'
                    }`}
                  >
                    ● Status: {item.status}
                  </span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                {item.title}
              </h1>

              {/* Photo Display */}
              {item.imageUrl && (
                <div className="mt-6 rounded-2xl overflow-hidden bg-slate-900 relative shadow-md">
                  <img
                    src={`http://localhost:5000${item.imageUrl}`}
                    alt={item.title}
                    className="w-full max-h-96 object-contain"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md text-[11px] font-semibold text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
                    <ShieldCheck className="w-4 h-4" />
                    <span>EXIF Privacy Sanitized (GPS Cleared)</span>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Incident Description
                </h3>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>

              {/* QR Handover Action Banner */}
              {item.status !== 'RESOLVED' && (
                <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-50 border border-amber-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-amber-600" />
                      <h4 className="font-black text-sm text-slate-900">
                        {isOwner ? 'Your Handover QR Code' : 'Scan Recipient QR to Earn +100 Pts'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                      {isOwner
                        ? 'Display your QR code when receiving your belonging. The returner will scan it to verify the return and earn +100 Campus Points.'
                        : 'Handing this item back to the owner? Scan their QR code upon handover to claim your +100 Campus Points reward!'}
                    </p>
                  </div>

                  <button
                    onClick={() => setIsQRModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-2 shrink-0"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{isOwner ? 'View My QR Code' : 'Scan & Claim +100 Pts'}</span>
                  </button>
                </div>
              )}

              {/* Secret Question Indicator */}
              {item.secretQuestion && (
                <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>Ownership Verification Active</span>
                  </div>
                  <p className="text-xs text-amber-800">
                    {isOwner
                      ? `Secret Question: "${item.secretQuestion}"`
                      : 'The poster has configured a security question to verify legitimate ownership upon claiming.'}
                  </p>
                </div>
              )}

              {/* Owner Controls */}
              {isOwner && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 mb-3">
                    Poster Management Options:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUpdateStatus('OPEN')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                        item.status === 'OPEN'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Mark Open
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('CLAIMED')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                        item.status === 'CLAIMED'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Mark Claimed
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('RESOLVED')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                        item.status === 'RESOLVED'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Mark Resolved / Returned
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Live Campus Discussion & Q&A */}
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Live Campus Item Messages ({messages.length})
                </h3>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto mb-4 p-2">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No messages yet. Ask questions about identifying marks or handover time!
                  </p>
                ) : (
                  messages.map((m: any) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-2xl max-w-[85%] text-xs ${
                        user && m.senderId === user.id
                          ? 'bg-sky-600 text-white ml-auto'
                          : 'bg-slate-100 text-slate-800 mr-auto'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span className="font-bold">{m.sender?.name || 'Campus Member'}</span>
                        <span className="text-[10px] opacity-75">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p>{m.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    user ? 'Type a question or message...' : 'Sign in with .edu to post messages'
                  }
                  disabled={!user}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                />
                <button
                  type="submit"
                  disabled={!user || !newMessageText.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition disabled:opacity-40 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Location & Claim Action */}
          <div className="space-y-6">
            {/* Action Box */}
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6 text-center">
              <h3 className="font-bold text-base text-slate-900 mb-2">
                {isLost ? 'Recognize this lost item?' : 'Is this your lost item?'}
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                {isLost
                  ? 'If you found this item, post a found report or send a message to coordinate return.'
                  : 'Submit a verified claim with proof of ownership to securely recover your item.'}
              </p>

              {!isOwner && item.type === 'FOUND' && item.status === 'OPEN' && (
                <button
                  onClick={() => {
                    if (!user) openAuthModal();
                    else setClaimModalOpen(true);
                  }}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Claim Ownership Now</span>
                </button>
              )}

              {/* Poster Profile */}
              <div className="mt-6 pt-6 border-t border-slate-100 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Reported By Verified Campus Member
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.user?.name}</p>
                    <p className="text-[11px] text-slate-500">{item.user?.campusName}</p>
                    {item.contactEmail && (
                      <p className="text-[11px] text-sky-600 font-medium">{item.contactEmail}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Incident Map Pin */}
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-red-500" />
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Incident Pin Location
                </h4>
              </div>
              <p className="text-xs font-semibold text-slate-700 mb-3">{item.locationName}</p>
              <div className="h-48 rounded-2xl overflow-hidden border border-slate-200">
                <CampusMap
                  items={[item]}
                  center={[item.latitude, item.longitude]}
                  zoom={16}
                  height="100%"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ClaimModal
        item={item}
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        onClaimSubmitted={fetchItemData}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onItemCreated={fetchItemData}
      />

      <HandoverQRModal
        item={item}
        isOwner={isOwner}
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onSuccess={() => {
          fetchItemData();
          refreshUser();
        }}
      />
    </div>
  );
}
