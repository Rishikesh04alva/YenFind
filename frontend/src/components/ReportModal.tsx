'use client';

import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  MapPin,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CAMPUS_HOTSPOTS } from '../lib/constants';

// Dynamically import CampusMap to avoid Leaflet SSR issues
const CampusMap = dynamic(() => import('./CampusMap'), { ssr: false });

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'LOST' | 'FOUND';
  onItemCreated?: () => void;
}

const CATEGORIES = [
  { id: 'ELECTRONICS', label: 'Electronics & Gadgets' },
  { id: 'KEYS_CARDS', label: 'Keys, IDs & Student Cards' },
  { id: 'CLOTHING', label: 'Jackets & Clothing' },
  { id: 'ACCESSORIES', label: 'Wallets & Jewelry' },
  { id: 'BAGS', label: 'Backpacks & Bags' },
  { id: 'DOCUMENTS', label: 'Books & Course Documents' },
  { id: 'OTHER', label: 'Other Miscellaneous' },
];

export default function ReportModal({
  isOpen,
  onClose,
  initialType = 'LOST',
  onItemCreated,
}: ReportModalProps) {
  const { user, openAuthModal } = useAuth();

  const [type, setType] = useState<'LOST' | 'FOUND'>(initialType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ELECTRONICS');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [secretQuestion, setSecretQuestion] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number }>({
    lat: 12.8703,
    lng: 74.8465,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleHotspotSelect = (hotspot: { name: string; lat: number; lng: number }) => {
    setSelectedLocation({ lat: hotspot.lat, lng: hotspot.lng });
    setLocationName(hotspot.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }

    if (!title || !description || !locationName) {
      setErrorMsg('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('locationName', locationName);
      formData.append('latitude', selectedLocation.lat.toString());
      formData.append('longitude', selectedLocation.lng.toString());
      if (secretQuestion) {
        formData.append('secretQuestion', secretQuestion);
      }
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await api.createItem(formData);
      if (res.success) {
        setSuccessResult(res);
        if (onItemCreated) onItemCreated();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                type === 'LOST' ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
            <h3 className="font-bold text-lg">
              {type === 'LOST' ? 'Report a Lost Item' : 'Report a Found Item'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {successResult ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">
                Report Successfully Published!
              </h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your report is now live on the campus map. All image GPS/EXIF metadata was safely scrubbed.
              </p>

              {successResult.matchesFound > 0 && (
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-left max-w-lg mx-auto">
                  <div className="flex items-center gap-2 text-sky-800 font-bold text-sm mb-2">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>Real-Time Match Alert ({successResult.matchesFound} Potential Match Found)</span>
                  </div>
                  <p className="text-xs text-sky-700">
                    Our matchmaking engine instantly detected {successResult.matchesFound} item(s) in the same area!
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition shadow-md"
              >
                Done & Return to Explorer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-slate-100">
                <button
                  type="button"
                  onClick={() => setType('LOST')}
                  className={`py-2.5 text-xs font-bold rounded-xl transition ${
                    type === 'LOST'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  I Lost An Item
                </button>
                <button
                  type="button"
                  onClick={() => setType('FOUND')}
                  className={`py-2.5 text-xs font-bold rounded-xl transition ${
                    type === 'FOUND'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  I Found An Item
                </button>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Item Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apple AirPods Pro 2 in White Case"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description & Distinguishing Features *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide details such as color, brand, stickers, scratches, or where it was placed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>

              {/* Image Upload with EXIF Privacy Scrubbing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Photo Upload (Optional)</span>
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Auto-EXIF Scrubbed for Privacy
                  </span>
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-sky-400 transition bg-slate-50/50">
                  {previewUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={previewUrl}
                        alt="Upload preview"
                        className="w-28 h-28 object-cover rounded-xl shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="text-xs text-red-500 font-semibold hover:underline"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5 py-2">
                      <UploadCloud className="w-8 h-8 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">
                        Click or drag photo here
                      </span>
                      <span className="text-[11px] text-slate-400">
                        GPS & camera hardware metadata is stripped before saving
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Interactive Campus Map Pinning */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Pin Campus Location *</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Click anywhere on the map or pick a hotspot
                  </span>
                </label>

                {/* Hotspot Presets */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {CAMPUS_HOTSPOTS.map((spot) => (
                    <button
                      key={spot.name}
                      type="button"
                      onClick={() => handleHotspotSelect(spot)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition ${
                        locationName === spot.name
                          ? 'bg-sky-100 border-sky-300 text-sky-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      📍 {spot.name}
                    </button>
                  ))}
                </div>

                <div className="mb-2">
                  <input
                    type="text"
                    required
                    placeholder="Specific Location (e.g. Hayden Library 2nd Floor Study Room 204)"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                  />
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <CampusMap
                    pickerMode={true}
                    pickerPosition={selectedLocation}
                    onLocationSelect={(lat, lng) => setSelectedLocation({ lat, lng })}
                    height="240px"
                  />
                </div>
              </div>

              {/* Verification Secret Question (Anti-theft/False Claim Protection) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Secret Ownership Question (Anti-False Claim Protection)
                </label>
                <input
                  type="text"
                  placeholder="e.g. What is the lock screen wallpaper or keychain color?"
                  value={secretQuestion}
                  onChange={(e) => setSecretQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Claimants will be asked this question to verify true ownership before item handover.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Scrubbing EXIF & Publishing...</span>
                  ) : (
                    <span>Publish Report</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
