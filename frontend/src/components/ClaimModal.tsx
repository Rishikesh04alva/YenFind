'use client';

import React, { useState } from 'react';
import { X, Shield, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface ClaimModalProps {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimSubmitted?: () => void;
}

export default function ClaimModal({
  item,
  isOpen,
  onClose,
  onClaimSubmitted,
}: ClaimModalProps) {
  const { user, openAuthModal } = useAuth();
  const [proofDescription, setProofDescription] = useState('');
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }

    if (!proofDescription.trim()) {
      setErrorMsg('Please describe specific proof of ownership.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.submitClaim(item.id, proofDescription, verificationAnswer);
      if (res.success) {
        setIsSuccess(true);
        if (onClaimSubmitted) onClaimSubmitted();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Claim Ownership Verification</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">Claim Submitted!</h4>
              <p className="text-xs text-slate-600">
                The finder has been notified in real time. They will review your proof and coordinate return via verified campus email.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Found Item
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">{item.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Found at: {item.locationName}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Describe Detailed Proof of Ownership *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe unique identifiers not visible in photos (e.g. engravings, exact scratches, contents inside, lockscreen background)..."
                  value={proofDescription}
                  onChange={(e) => setProofDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                />
              </div>

              {item.secretQuestion && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Poster's Security Question</span>
                  </label>
                  <p className="text-xs text-amber-800 font-medium mb-2 italic">
                    "{item.secretQuestion}"
                  </p>
                  <input
                    type="text"
                    placeholder="Your Answer..."
                    value={verificationAnswer}
                    onChange={(e) => setVerificationAnswer(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying & Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
