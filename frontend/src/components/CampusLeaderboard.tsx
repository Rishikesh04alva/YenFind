'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, Award, Sparkles, Star } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  campusName: string;
  points: number;
  itemsReturned: number;
}

export default function CampusLeaderboard() {
  const { user } = useAuth();
  const [top3, setTop3] = useState<LeaderboardUser[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.getLeaderboard();
      if (res.success) {
        setTop3(res.top3 || []);
        setLeaderboard(res.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchLeaderboard();
    };

    if (socket) {
      socket.on('leaderboard_updated', handleUpdate);
      socket.on('item_status_updated', handleUpdate);
    }

    return () => {
      if (socket) {
        socket.off('leaderboard_updated', handleUpdate);
        socket.off('item_status_updated', handleUpdate);
      }
    };
  }, []);

  // If no users have earned points yet, render clean empty state with zero placeholders
  if (leaderboard.length === 0) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6 sm:p-8 mb-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Trophy className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-base text-slate-900">
          Campus Return Leaderboard
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          No users have earned karma points yet. Return found items to take the #1 position on campus!
        </p>
        <div className="mt-4 inline-flex items-center gap-3 text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="text-emerald-600">+100 pts per Return</span>
          <span>•</span>
          <span className="text-sky-600">+20 pts Found</span>
          <span>•</span>
          <span className="text-purple-600">+10 pts Lost</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6 sm:p-8 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 mb-1.5 shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Campus Return Champions</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Top Campus Leaderboard ({leaderboard.length})
          </h2>
          <p className="text-xs text-slate-500">
            Real-time rankings for students & staff returning found items on campus.
          </p>
        </div>

        {/* Point Rules */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl shrink-0">
          <span className="flex items-center gap-1 text-emerald-600">
            <Award className="w-3.5 h-3.5" /> +100 Return
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-sky-600">
            <Sparkles className="w-3.5 h-3.5" /> +20 Found
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-purple-600">
            +10 Lost
          </span>
        </div>
      </div>

      {/* Special Mention to Top 3 Featured Heroes Podium (Only Rendered When Real Users Earn Points) */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Rank 2 (Silver) */}
          {top3[1] && (
            <div
              className={`order-2 md:order-1 rounded-2xl p-5 bg-gradient-to-b from-slate-100 via-slate-50 to-white border text-center relative flex flex-col justify-between shadow-sm transition ${
                user && user.id === top3[1].id ? 'border-sky-500 ring-2 ring-sky-400/40' : 'border-slate-200'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-extrabold text-xs flex items-center justify-center mx-auto mb-3 shadow">
                #2
              </div>
              <div>
                <div className="w-14 h-14 rounded-full bg-slate-200 border-2 border-slate-400 flex items-center justify-center mx-auto mb-2 text-slate-700 font-bold text-lg shadow-inner">
                  <Medal className="w-7 h-7 text-slate-500" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-center gap-1">
                  <span className="truncate">{top3[1].name}</span>
                  {user && user.id === top3[1].id && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">
                      (You)
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {top3[1].itemsReturned} Items Returned Safe
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                <span className="font-black text-sm text-slate-900">
                  {top3[1].points}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">pts</span>
              </div>
            </div>
          )}

          {/* Rank 1 (Gold / Crown - Top Position) */}
          {top3[0] && (
            <div
              className={`order-1 md:order-2 rounded-2xl p-6 bg-gradient-to-b from-amber-100 via-amber-50 to-white border-2 text-center relative shadow-lg shadow-amber-500/10 flex flex-col justify-between md:scale-105 z-10 transition ${
                user && user.id === top3[0].id
                  ? 'border-amber-400 ring-2 ring-amber-400/50'
                  : 'border-amber-300'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Crown className="w-3 h-3" /> Campus Champion
              </div>
              <div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border-2 border-white flex items-center justify-center mx-auto mb-2 text-white font-black text-xl shadow-md">
                  👑
                </div>
                <h4 className="font-black text-base text-slate-900 flex items-center justify-center gap-1.5">
                  <span className="truncate">{top3[0].name}</span>
                  {user && user.id === top3[0].id && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      (You)
                    </span>
                  )}
                </h4>
                <p className="text-xs text-amber-800 font-semibold mt-0.5">
                  {top3[0].itemsReturned} Items Returned Safe
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-200">
                <span className="font-black text-lg text-amber-900">
                  {top3[0].points}
                </span>
                <span className="text-xs text-amber-700 font-extrabold uppercase ml-1">pts</span>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3[2] && (
            <div
              className={`order-3 rounded-2xl p-5 bg-gradient-to-b from-amber-50/50 to-orange-50/30 border text-center relative flex flex-col justify-between shadow-sm transition ${
                user && user.id === top3[2].id ? 'border-sky-500 ring-2 ring-sky-400/40' : 'border-amber-200/80'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 font-extrabold text-xs flex items-center justify-center mx-auto mb-3 shadow">
                #3
              </div>
              <div>
                <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center mx-auto mb-2 text-amber-800 font-bold text-lg shadow-inner">
                  <Medal className="w-7 h-7 text-amber-600" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-center gap-1">
                  <span className="truncate">{top3[2].name}</span>
                  {user && user.id === top3[2].id && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">
                      (You)
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {top3[2].itemsReturned} Items Returned Safe
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-amber-200/80">
                <span className="font-black text-sm text-amber-950">
                  {top3[2].points}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">pts</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rankings Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <span>Rank</span>
            <span>Campus Member</span>
          </div>
          <div className="flex items-center gap-6 text-right">
            <span className="hidden sm:inline">Items Returned</span>
            <span>Karma Score</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {leaderboard.slice(0, 10).map((rankUser) => {
            const isCurrentUser = user && user.id === rankUser.id;
            return (
              <div
                key={rankUser.id}
                className={`px-4 py-3.5 flex items-center justify-between text-xs transition ${
                  isCurrentUser
                    ? 'bg-sky-50/70 border-l-4 border-l-sky-500'
                    : rankUser.rank <= 3
                    ? 'bg-amber-50/20 hover:bg-amber-50/40'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-[11px] ${
                      rankUser.rank === 1
                        ? 'bg-amber-400 text-white'
                        : rankUser.rank === 2
                        ? 'bg-slate-300 text-slate-800'
                        : rankUser.rank === 3
                        ? 'bg-amber-200 text-amber-900'
                        : 'text-slate-400 bg-slate-100'
                    }`}
                  >
                    {rankUser.rank}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{rankUser.name}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                          You
                        </span>
                      )}
                      {rankUser.rank === 1 && (
                        <Crown className="w-3.5 h-3.5 text-amber-500 inline" />
                      )}
                      {rankUser.rank > 1 && rankUser.rank <= 3 && (
                        <Star className="w-3.5 h-3.5 text-amber-500 inline" />
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {rankUser.campusName || 'Yenepoya Campus'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right font-medium">
                  <span className="hidden sm:inline text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md font-bold text-[11px]">
                    {rankUser.itemsReturned} returned
                  </span>
                  <span className="font-black text-slate-900 text-sm">
                    {rankUser.points} <span className="text-[10px] font-bold text-slate-400">PTS</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
