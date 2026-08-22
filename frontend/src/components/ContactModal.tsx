'use client';

import React from 'react';
import { X, Phone, User, MessageCircle, School, ShieldCheck } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
            <User className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-xl">Contact Information</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Developer & Campus Administrator Details
          </p>
        </div>

        {/* Contact Details Card */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Developer Name
              </span>
              <p className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <span>Rishikesh R Alva</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Lead
                </span>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Phone / WhatsApp Number
              </span>
              <p className="text-base font-extrabold text-indigo-600 mt-0.5">
                +91 9902822296
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Institution & Campus
              </span>
              <p className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                <School className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Yenepoya School of Engineering & Technology, Balmatta, Mangalore</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href="tel:9902822296"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Call Direct</span>
            </a>

            <a
              href="https://wa.me/919902822296"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
