import React, { useEffect, useRef, useState } from 'react';
import { findEligiblePartners } from '../lib/partnerFilter';

export default function PartnerMap({ userLat, userLng, loanCategory, t }) {
  const [filterUnhealthy, setFilterUnhealthy] = useState(true);
  const [npaThreshold, setNpaThreshold] = useState(8.0);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Compute eligible & excluded partners
  const partnerResults = findEligiblePartners({
    userLat,
    userLng,
    loanCategory,
    npaThreshold: filterUnhealthy ? npaThreshold : 100, // if filter disabled, allow all
    utilizationThreshold: filterUnhealthy ? 50.0 : 0,
  });

  const { eligible, excluded } = partnerResults;

  // Initialize and update Leaflet Map
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    let L;
    try {
      L = require('leaflet');
    } catch (e) {
      console.error('Leaflet load error:', e);
      return;
    }

    const container = document.getElementById('leaflet-map-container');
    if (!container) return;

    // Create map instance if not already created
    if (!mapInstanceRef.current) {
      const map = L.map('leaflet-map-container').setView([userLat, userLng], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([userLat, userLng], 11);
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Custom Icons
    const createCustomIcon = (colorSymbol, isUser = false) => {
      const bg = isUser ? '#E3A83B' : colorSymbol === 'green' ? '#4E9C7D' : '#C77066';
      const label = isUser ? 'YOU' : colorSymbol === 'green' ? '✓' : '✕';
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="
          background:${bg};
          color:#0C0F1E;
          width:28px;
          height:28px;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:bold;
          font-size:11px;
          border:2px solid #F3EFE6;
          box-shadow:0 4px 10px rgba(0,0,0,0.5);
          font-family:IBM Plex Mono, monospace;
        ">${label}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
    };

    // User Location Marker
    const userMarker = L.marker([userLat, userLng], {
      icon: createCustomIcon('gold', true),
    }).addTo(map);
    userMarker.bindPopup(`<b>📍 Applicant Location</b><br/>Lat: ${userLat}, Lng: ${userLng}`);
    markersRef.current.push(userMarker);

    // Add Eligible Partner Markers
    eligible.forEach((partner) => {
      const marker = L.marker([partner.latitude, partner.longitude], {
        icon: createCustomIcon('green'),
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:IBM Plex Sans, sans-serif; padding:4px;">
          <b style="color:#E3A83B; font-size:13px;">${partner.name}</b><br/>
          <span style="font-size:11px; color:#9A9284;">${partner.type} · ${partner.distanceKm} km away</span><br/>
          <div style="margin-top:6px; font-size:11px; font-family:IBM Plex Mono, monospace;">
            NPA Rate: <b>${partner.npaRate}%</b><br/>
            Utilization: <b>${partner.fundUtilization}%</b>
          </div>
          <span style="display:inline-block; margin-top:6px; color:#4E9C7D; font-weight:bold; font-size:10px; text-transform:uppercase;">
            ✓ Route Authorized
          </span>
        </div>
      `);

      marker.on('click', () => setSelectedPartnerId(partner.id));
      markersRef.current.push(marker);
    });

    // Add Excluded Partner Markers (if showing all)
    if (!filterUnhealthy) {
      excluded.forEach((partner) => {
        const marker = L.marker([partner.latitude, partner.longitude], {
          icon: createCustomIcon('red'),
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family:IBM Plex Sans, sans-serif; padding:4px;">
            <b style="color:#C77066; font-size:13px;">${partner.name}</b><br/>
            <span style="font-size:11px; color:#9A9284;">${partner.type} · ${partner.distanceKm} km away</span><br/>
            <div style="margin-top:6px; font-size:11px; font-family:IBM Plex Mono, monospace; color:#C77066;">
              NPA Rate: <b>${partner.npaRate}%</b> (Exceeds threshold)<br/>
              Utilization: <b>${partner.fundUtilization}%</b>
            </div>
            <span style="display:inline-block; margin-top:6px; color:#C77066; font-weight:bold; font-size:10px; text-transform:uppercase;">
              ✕ Filtered Out (High Risk)
            </span>
          </div>
        `);

        marker.on('click', () => setSelectedPartnerId(partner.id));
        markersRef.current.push(marker);
      });
    }

    // Invalidate map size after rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [userLat, userLng, eligible, excluded, filterUnhealthy]);

  return (
    <div id="partner-map-section" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="field-label" style={{ marginBottom: 0 }}>
          {t?.labels?.findPartners || 'Nearest Eligible Channel Partners'} ({eligible.length})
        </div>
        <label
          htmlFor="checkbox-filter-unhealthy"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--ink-dim)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            id="checkbox-filter-unhealthy"
            checked={filterUnhealthy}
            onChange={(e) => setFilterUnhealthy(e.target.checked)}
            style={{ accentColor: 'var(--gold)' }}
          />
          <span>{t?.labels?.filterHealthyOnly || 'Hide Unhealthy Partners (NPA > 8%)'}</span>
        </label>
      </div>

      {/* Leaflet Map Container */}
      <div id="leaflet-map-container"></div>

      {/* Ranked Partner List */}
      <div id="partner-list-container">
        <div className="field-label" style={{ marginBottom: '12px' }}>
          Ranked Partner List (Filtered by Health & Distance)
        </div>

        {eligible.map((partner) => (
          <div
            key={partner.id}
            id={`partner-card-${partner.id}`}
            className="partner"
            style={{
              background: selectedPartnerId === partner.id ? 'rgba(227,168,59,0.1)' : 'transparent',
              padding: '12px 10px',
              borderRadius: '4px',
              transition: 'background 0.2s',
            }}
          >
            <div>
              <div className="partner-name">{partner.name}</div>
              <div className="partner-meta">
                {partner.distanceKm} km · NPA {partner.npaRate}% · Utilization {partner.fundUtilization}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--stone-dim)', marginTop: '2px' }}>
                📞 {partner.phone} | ✉️ {partner.email}
              </div>
            </div>
            <span id={`health-pill-${partner.id}`} className="health-pill health-good">
              {t?.labels?.healthy || 'Route Here'}
            </span>
          </div>
        ))}

        {!filterUnhealthy && excluded.length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--rule)' }}>
            <div className="field-label" style={{ color: 'var(--coral)', marginBottom: '10px' }}>
              Filtered Out Partners (High Risk / Low Utilization)
            </div>
            {excluded.map((partner) => (
              <div
                key={partner.id}
                id={`partner-card-${partner.id}`}
                className="partner"
                style={{ opacity: 0.7 }}
              >
                <div>
                  <div className="partner-name" style={{ color: 'var(--coral)' }}>
                    {partner.name}
                  </div>
                  <div className="partner-meta">
                    {partner.distanceKm} km · NPA {partner.npaRate}% · Utilization {partner.fundUtilization}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--coral)', marginTop: '2px' }}>
                    Reason: {partner.exclusionReasons.map((r) => r.detail).join(' | ')}
                  </div>
                </div>
                <span id={`health-pill-${partner.id}`} className="health-pill health-bad">
                  {t?.labels?.unhealthy || 'Filtered Out'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
