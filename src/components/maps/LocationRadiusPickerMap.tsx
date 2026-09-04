"use client";

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface LocationRadiusPickerMapProps {
  latitude: number;
  longitude: number;
  radiusMeter: number;
  onChangeLocation?: (lat: number, lng: number) => void;
  height?: string;
  readOnly?: boolean;
}

export default function LocationRadiusPickerMap({
  latitude,
  longitude,
  radiusMeter,
  onChangeLocation,
  height = '300px',
  readOnly = false
}: LocationRadiusPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  // Validasi koordinat fallback
  const validLat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : -7.55611;
  const validLng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : 110.83167;
  const validRadius = typeof radiusMeter === 'number' && !isNaN(radiusMeter) && radiusMeter > 0 ? radiusMeter : 100;

  useEffect(() => {
    let isMounted = true;

    // Load Leaflet dynamically on client-side
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Hancurkan instance lama jika ada
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Custom Modern SVG Pin Marker
      const customPinIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; transform: translate(-50%, -100%);">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <div style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      // Inisialisasi Peta
      const map = L.map(mapContainerRef.current, {
        center: [validLat, validLng],
        zoom: 17,
        zoomControl: true,
        attributionControl: false
      });

      mapInstanceRef.current = map;

      // Tile Layer OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      // Circle Radius Geofencing
      const circle = L.circle([validLat, validLng], {
        radius: validRadius,
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.25,
        weight: 2,
        dashArray: '4, 4'
      }).addTo(map);

      circleRef.current = circle;

      // Marker Titik Kantor
      const marker = L.marker([validLat, validLng], {
        icon: customPinIcon,
        draggable: !readOnly
      }).addTo(map);

      markerRef.current = marker;

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong>Titik Lokasi Kantor</strong><br/>
          Lat: ${validLat.toFixed(6)}<br/>
          Lng: ${validLng.toFixed(6)}<br/>
          Radius: ${validRadius} meter
        </div>
      `);

      // Event Drag Marker
      if (!readOnly && onChangeLocation) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          const newLat = Number(pos.lat.toFixed(6));
          const newLng = Number(pos.lng.toFixed(6));
          circle.setLatLng([newLat, newLng]);
          onChangeLocation(newLat, newLng);
        });

        // Event Klik Peta untuk Geser Titik
        map.on('click', (e: any) => {
          const newLat = Number(e.latlng.lat.toFixed(6));
          const newLng = Number(e.latlng.lng.toFixed(6));
          marker.setLatLng([newLat, newLng]);
          circle.setLatLng([newLat, newLng]);
          onChangeLocation(newLat, newLng);
        });
      }

      // Invalidate Size saat mount di dalam Dialog/Modal
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update posisi Marker & Radius Circle ketika props berubah
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      const currentPos = markerRef.current.getLatLng();
      const posChanged = Math.abs(currentPos.lat - validLat) > 0.000001 || Math.abs(currentPos.lng - validLng) > 0.000001;

      if (posChanged) {
        markerRef.current.setLatLng([validLat, validLng]);
        circleRef.current.setLatLng([validLat, validLng]);
        mapInstanceRef.current.panTo([validLat, validLng], { animate: true });
      }

      circleRef.current.setRadius(validRadius);
      markerRef.current.setPopupContent(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong>Titik Lokasi Kantor</strong><br/>
          Lat: ${validLat.toFixed(6)}<br/>
          Lng: ${validLng.toFixed(6)}<br/>
          Radius: ${validRadius} meter
        </div>
      `);
    }
  }, [validLat, validLng, validRadius]);

  const handleCenterMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([validLat, validLng], 17, { animate: true });
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden border border-border shadow-inner bg-muted/40">
        <div 
          ref={mapContainerRef} 
          style={{ height, width: '100%', minHeight: '240px' }} 
          className="z-0"
        />

        {/* Tombol Re-Center & Info Badge */}
        <div className="absolute top-2 right-2 z-[400] flex gap-1.5">
          <button
            type="button"
            onClick={handleCenterMap}
            title="Pusatkan Peta ke Lokasi Kantor"
            className="bg-background/90 hover:bg-background border border-border text-foreground px-2.5 py-1 rounded-md text-xs font-medium shadow-sm backdrop-blur-sm transition-all"
          >
            🎯 Pusatkan
          </button>
        </div>

        {/* Radius Info Pill */}
        <div className="absolute bottom-2 left-2 z-[400] bg-background/90 border border-border px-2.5 py-1 rounded-md text-[11px] text-foreground font-mono shadow-sm backdrop-blur-sm flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          Radius: <strong className="text-blue-600 dark:text-blue-400">{validRadius}m</strong>
        </div>
      </div>

      {!readOnly && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <span>💡</span> Klik pada peta atau geser pin merah untuk menentukan titik lokasi kantor yang tepat. Lingkaran biru menunjukkan radius jangkauan presensi.
        </p>
      )}
    </div>
  );
}
