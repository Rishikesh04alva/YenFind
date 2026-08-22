'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  X,
  Scan,
  Award,
  ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface HandoverQRModalProps {
  item: any;
  isOwner: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function HandoverQRModal({
  item,
  isOwner,
  isOpen,
  onClose,
  onSuccess,
}: HandoverQRModalProps) {
  const { user, openAuthModal, refreshUser } = useAuth();
  const [scannedCodeInput, setScannedCodeInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  // The secure QR payload contains the Item ID and unique handover code
  const qrPayload = JSON.stringify({
    app: 'Yenfind',
    itemId: item.id,
    title: item.title,
    code: item.handoverCode || item.actualHandoverCode || 'YEN-VERIFY',
  });

  const handleVerifyCode = async (codeToSubmit?: string) => {
    if (!user) {
      openAuthModal();
      return;
    }

    const code = codeToSubmit || scannedCodeInput.trim();
    if (!code) {
      setErrorMessage('Please enter or scan the recipient Handover Code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.verifyHandover(item.id, code);
      if (res.success) {
        setSuccessMessage(res.message || '🎉 Handover Verified! +100 Campus Points awarded to your account!');
        await refreshUser();
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Quick 1-Click Simulation helper so the returner can test instant QR scanning
  const handleSimulateScan = () => {
    const code = item.handoverCode || item.actualHandoverCode;
    if (code) {
      setScannedCodeInput(code);
      handleVerifyCode(code);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-xl">QR Handover & Points Verification</h3>
          <p className="text-xs text-slate-300 mt-1">
            Safe item physical exchange verification with instant <span className="text-amber-300 font-bold">+100 Campus Points</span> reward.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-in zoom-in-95">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 animate-bounce" />
              <div>
                <p className="font-bold text-sm">{successMessage}</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Your points balance has been updated live!</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Recipient View: Shows QR Code */}
          {isOwner ? (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-5 rounded-3xl bg-slate-50 border-2 border-slate-200/80 shadow-inner flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                  <QRCodeSVG
                    value={qrPayload}
                    size={190}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-mono font-bold">
                  <span>Code:</span>
                  <span>{item.handoverCode || item.actualHandoverCode || 'YEN-VERIFY'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Show this QR to the person returning your item
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  When they scan or enter this code upon handing over your <strong>{item.title}</strong>, they will instantly receive their +100 Campus Points!
                </p>
              </div>
            </div>
          ) : (
            /* Returner / Scanner View: Scan or Input Code */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900">
                <div className="flex items-center gap-2 font-extrabold text-xs mb-1">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Returning "{item.title}"?</span>
                </div>
                <p className="text-xs text-amber-800/90 leading-relaxed">
                  Ask the recipient to display their Handover QR code or 8-digit verification code. Once verified, you will immediately earn <span className="font-black text-amber-950">+100 Campus Points</span>!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Recipient Handover Code (e.g. YEN-XXXXXX)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Handover Code"
                    value={scannedCodeInput}
                    onChange={(e) => setScannedCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                  <button
                    onClick={() => handleVerifyCode()}
                    disabled={isVerifying || !scannedCodeInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <span>{isVerifying ? 'Verifying...' : 'Claim +100 Pts'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Demo 1-Click Scan Button */}
              {item.handoverCode && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSimulateScan}
                    disabled={isVerifying}
                    className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Scan className="w-4 h-4 text-indigo-600" />
                    <span>⚡ Quick Scan Handover (Test with Code: {item.handoverCode})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Yenfind Anti-Fraud Handover</span>
            </span>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
