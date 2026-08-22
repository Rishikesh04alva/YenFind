'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Compass } from 'lucide-react';
import Link from 'next/link';

// Helper to safely build DivIcons in browser
const getCustomIcon = (type: 'LOST' | 'FOUND') => {
  if (typeof window === 'undefined') return undefined as any;
  const isLost = type === 'LOST';
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="${isLost ? 'lost-marker-pin' : 'found-marker-pin'}">
        <div class="marker-inner-icon">${isLost ? '?' : '✓'}</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const getPickerIcon = () => {
  if (typeof window === 'undefined') return undefined as any;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="width: 36px; height: 36px; border-radius: 50%; background: #3b82f6; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); animation: pulse 1.5s infinite;">
        <div style="width: 12px; height: 12px; border-radius: 50%; background: white;"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

function LocationPickerHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface ItemMarkerData {
  id: string;
  type: 'LOST' | 'FOUND';
  title: string;
  category: string;
  locationName: string;
  latitude: number;
  longitude: number;
  thumbnailUrl?: string;
  imageUrl?: string;
  createdAt: string;
}

interface CampusMapProps {
  items?: ItemMarkerData[];
  selectedItem?: ItemMarkerData | null;
  pickerMode?: boolean;
  pickerPosition?: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
  radiusMeters?: number;
  height?: string;
}

export default function CampusMap({
  items = [],
  selectedItem = null,
  pickerMode = false,
  pickerPosition = null,
  onLocationSelect,
  center = [12.8703, 74.8465], // Yenepoya Balmatta, Mangalore Campus Center
  zoom = 16,
  radiusMeters,
  height = '520px',
}: CampusMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        style={{ height }}
        className="w-full bg-slate-900/5 rounded-2xl flex flex-col items-center justify-center border border-slate-200 animate-pulse"
      >
        <Compass className="w-10 h-10 text-sky-500 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading Campus Interactive Map...</p>
      </div>
    );
  }

  const pickerIcon = getPickerIcon();

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-slate-200/80">
      <MapContainer
        center={pickerPosition ? [pickerPosition.lat, pickerPosition.lng] : center}
        zoom={zoom}
        style={{ height, width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pickerMode && onLocationSelect && (
          <LocationPickerHandler onLocationSelect={onLocationSelect} />
        )}

        {pickerMode && pickerPosition && pickerIcon && (
          <Marker position={[pickerPosition.lat, pickerPosition.lng]} icon={pickerIcon}>
            <Popup>
              <div className="text-center p-1">
                <p className="font-semibold text-xs text-sky-700">Selected Incident Location</p>
                <p className="text-[10px] text-slate-500">
                  {pickerPosition.lat.toFixed(5)}, {pickerPosition.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {radiusMeters && center && (
          <Circle
            center={center}
            radius={radiusMeters}
            pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.12, weight: 2, dashArray: '6, 6' }}
          />
        )}

        {!pickerMode &&
          items.map((item) => {
            const icon = getCustomIcon(item.type);
            return (
              <Marker
                key={item.id}
                position={[item.latitude, item.longitude]}
                icon={icon}
              >
                <Popup className="custom-item-popup">
                  <div className="max-w-[220px] p-1 space-y-2">
                    {item.thumbnailUrl && (
                      <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-100 relative">
                        <img
                          src={`http://localhost:5000${item.thumbnailUrl}`}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur">
                          EXIF Clean
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.type === 'LOST'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.locationName}</span>
                      </p>
                    </div>
                    <Link
                      href={`/items/${item.id}`}
                      className="block text-center w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow transition"
                    >
                      View Details & Claim
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-10 glass-panel rounded-xl px-3 py-2 text-xs flex items-center gap-4 shadow-lg border border-slate-200">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm"></span>
          <span className="font-semibold text-slate-700">Lost Items</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
          <span className="font-semibold text-slate-700">Found Items</span>
        </div>
        {pickerMode && (
          <div className="flex items-center gap-1.5 text-sky-600 font-medium border-l border-slate-300 pl-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>Click map to pin incident location</span>
          </div>
        )}
      </div>
    </div>
  );
}
