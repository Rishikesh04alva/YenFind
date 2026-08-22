'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Laptop,
  Key,
  Shirt,
  Glasses,
  Briefcase,
  FileText,
  HelpCircle,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface ItemCardProps {
  item: {
    id: string;
    type: 'LOST' | 'FOUND';
    title: string;
    description: string;
    category: string;
    locationName: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    status: string;
    dateLostOrFound: string;
    secretQuestion?: string | null;
    user?: {
      name: string;
      email?: string;
      campusName?: string;
    };
  };
  onClaim?: (item: any) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ELECTRONICS: <Laptop className="w-3.5 h-3.5" />,
  KEYS_CARDS: <Key className="w-3.5 h-3.5" />,
  CLOTHING: <Shirt className="w-3.5 h-3.5" />,
  ACCESSORIES: <Glasses className="w-3.5 h-3.5" />,
  BAGS: <Briefcase className="w-3.5 h-3.5" />,
  DOCUMENTS: <FileText className="w-3.5 h-3.5" />,
  OTHER: <HelpCircle className="w-3.5 h-3.5" />,
};

export default function ItemCard({ item, onClaim }: ItemCardProps) {
  const isLost = item.type === 'LOST';

  const timeFormatted = new Date(item.dateLostOrFound).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="group rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col justify-between">
      <div>
        {/* Card Header & Thumbnail */}
        <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
          {item.imageUrl ? (
            <img
              src={`http://localhost:5000${item.thumbnailUrl || item.imageUrl}`}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 mb-2">
                {CATEGORY_ICONS[item.category] || <HelpCircle className="w-6 h-6" />}
              </div>
              <span className="text-xs font-medium text-slate-400">Photo Protected / Scrubbed</span>
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span
              className={`text-xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md backdrop-blur-md ${
                isLost
                  ? 'bg-red-500/90 text-white border border-red-400'
                  : 'bg-emerald-500/90 text-white border border-emerald-400'
              }`}
            >
              {item.type}
            </span>
          </div>

          {/* Privacy & EXIF Scrubbed Indicator */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-md text-[10px] font-medium text-white px-2 py-0.5 rounded-full border border-white/20">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>EXIF Sanitized</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
              {CATEGORY_ICONS[item.category]}
              <span>{item.category.replace('_', ' ')}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{timeFormatted}</span>
            </span>
          </div>

          <h3 className="font-bold text-base text-slate-900 line-clamp-1 group-hover:text-sky-600 transition">
            {item.title}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
            {item.description}
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="truncate">{item.locationName}</span>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
        <Link
          href={`/items/${item.id}`}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
        >
          <span>Inspect Details</span>
          <ArrowRight className="w-3 h-3" />
        </Link>

        {onClaim && item.type === 'FOUND' && item.status === 'OPEN' && (
          <button
            onClick={() => onClaim(item)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm"
          >
            Claim This
          </button>
        )}
      </div>
    </div>
  );
}
