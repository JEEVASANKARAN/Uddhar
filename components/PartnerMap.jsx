import React, { useEffect, useRef, useState } from 'react';
import { findEligiblePartners } from '../lib/partnerFilter';

export default function PartnerMap({ userLat, userLng, loanCategory, t }) {
  const [filterUnhealthy, setFilterUnhealthy] = useState(true);
  const [npaThreshold] = useState(8.0);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Compute eligible & excluded partners
  const partnerResults = findEligiblePartners({
    userLat,
    userLng,
    loanCategory,
    npaThreshold: filterUnhealthy ? npaThreshold : 100,
    utilizationThreshold: filterUnhealthy ? 50.0 : 0,
  });

  const { eligible, excluded } = partnerResults;
  // Top recommendation = eligible[0] (closest healthy partner)
  const topRecommended = eligible[0] || null;

  // Initialize and update Leaflet Map
  useEffect(() => {
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

    // Custom Icons — Phase 7: top recommendation gets a larger gold-outlined icon
    const createCustomIcon = (type) => {
      const configs = {
        user: { bg: '#E3A83B', label: 'YOU', size: 30, border: '2.5px solid #F3EFE6', shadow: '0 4px 14px rgba(227,168,59,0.5)' },
        recommended: { bg: '#4E9C7D', label: '★', size: 36, border: '3px solid #E3A83B', shadow: '0 0 0 4px rgba(227,168,59,0.25), 0 4px 14px rgba(0,0,0,0.6)' },
        healthy: { bg: '#4E9C7D', label: '✓', size: 28, border: '2px solid #F3EFE6', shadow: '0 4px 10px rgba(0,0,0,0.5)' },
        excluded: { bg: '#C77066', label: '✕', size: 26, border: '2px solid rgba(243,239,230,0.5)', shadow: '0 2px 6px rgba(0,0,0,0.4)' },
      };
      const c = configs[type] || configs.healthy;
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="
          background:${c.bg};
          color:#0C0F1E;
          width:${c.size}px;
          height:${c.size}px;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:bold;
          font-size:${type === 'recommended' ? '14px' : '11px'};
          border:${c.border};
          box-shadow:${c.shadow};
          font-family:IBM Plex Mono, monospace;
          transition: transform 0.2s;
        ">${c.label}</div>`,
        iconSize: [c.size, c.size],
        iconAnchor: [c.size / 2, c.size / 2],
      });
    };

    // User Location Marker
    const userMarker = L.marker([userLat, userLng], {
      icon: createCustomIcon('user'),
      zIndexOffset: 1000,
    }).addTo(map);
    userMarker.bindPopup(`<b>📍 Applicant Location</b><br/>Lat: ${userLat.toFixed(4)}, Lng: ${userLng.toFixed(4)}`);
    markersRef.current.push(userMarker);

    // Add Eligible Partner Markers — top one gets the star icon
    eligible.forEach((partner, idx) => {
      const isTop = idx === 0;
      const marker = L.marker([partner.latitude, partner.longitude], {
        icon: createCustomIcon(isTop ? 'recommended' : 'healthy'),
        zIndexOffset: isTop ? 900 : 0,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:IBM Plex Sans, sans-serif; padding:4px; min-width:180px;">
          ${isTop ? `<div style="font-family:IBM Plex Mono,monospace;font-size:9px;color:#E3A83B;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">★ Top Recommended</div>` : ''}
          <b style="color:#E3A83B; font-size:13px;">${partner.name}</b><br/>
          <span style="font-size:11px; color:#9A9284;">${partner.type} · ${partner.distanceKm} km away</span><br/>
          <div style="margin-top:6px; font-size:11px; font-family:IBM Plex Mono, monospace;">
            NPA Rate: <b>${partner.npaRate}%</b><br/>
            Utilization: <b>${partner.fundUtilization}%</b>
          </div>
          <div style="margin-top:4px; font-size:10px; color:#9A9284;">
            📞 ${partner.phone}
          </div>
          <span style="display:inline-block; margin-top:6px; color:#4E9C7D; font-weight:bold; font-size:10px; text-transform:uppercase;">
            ✓ Route Authorized
          </span>
        </div>
      `);

      marker.on('click', () => setSelectedPartnerId(partner.id));
      markersRef.current.push(marker);

      // Auto-open popup for top recommendation
      if (isTop) {
        marker.openPopup();
      }
    });

    // Add Excluded Partner Markers (if showing all)
    if (!filterUnhealthy) {
      excluded.forEach((partner) => {
        const marker = L.marker([partner.latitude, partner.longitude], {
          icon: createCustomIcon('excluded'),
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

    setTimeout(() => { map.invalidateSize(); }, 200);

  }, [userLat, userLng, eligible, excluded, filterUnhealthy]);

  return (
    <div id="partner-map-section" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="field-label" style={{ marginBottom: 0 }}>
          {t?.labels?.findPartners || 'Nearest Eligible Channel Partners'} ({eligible.length})
        </div>
        <label
          htmlFor="checkbox-filter-unhealthy"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink-dim)', cursor: 'pointer' }}
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

      {/* Phase 7: Top Recommendation Banner */}
      {topRecommended && (
        <div
          id="top-recommended-banner"
          style={{
            margin: '14px 0',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(78,156,125,0.15), rgba(78,156,125,0.05))',
            border: '1px solid rgba(78,156,125,0.4)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--jade)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>
              ★ Top Recommendation
            </div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{topRecommended.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--stone)' }}>
              {topRecommended.distanceKm} km · NPA {topRecommended.npaRate}% · {topRecommended.type}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--stone-dim)' }}>📞 {topRecommended.phone}</div>
            <div style={{ fontSize: '11px', color: 'var(--stone-dim)' }}>✉️ {topRecommended.email}</div>
          </div>
        </div>
      )}

      {/* Ranked Partner List */}
      <div id="partner-list-container">
        <div className="field-label" style={{ marginBottom: '12px' }}>
          All Eligible Partners — Ranked by Health &amp; Distance
        </div>

        {eligible.map((partner, idx) => (
          <div
            key={partner.id}
            id={`partner-card-${partner.id}`}
            className="partner"
            onClick={() => setSelectedPartnerId(partner.id)}
            style={{
              background: selectedPartnerId === partner.id
                ? 'rgba(227,168,59,0.10)'
                : idx === 0
                  ? 'rgba(78,156,125,0.07)'
                  : 'transparent',
              padding: '12px 10px',
              borderRadius: '4px',
              transition: 'background 0.2s',
              cursor: 'pointer',
              borderLeft: idx === 0 ? '2px solid var(--jade)' : '2px solid transparent',
            }}
          >
            <div>
              <div className="partner-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {idx === 0 && (
                  <span style={{ fontSize: '10px', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--jade)', border: '1px solid rgba(78,156,125,0.4)', padding: '1px 6px', borderRadius: '2px' }}>
                    ★ TOP
                  </span>
                )}
                {partner.name}
              </div>
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
              Filtered Out — High Risk / Low Utilization ({excluded.length})
            </div>
            {excluded.map((partner) => (
              <div
                key={partner.id}
                id={`partner-card-${partner.id}`}
                className="partner"
                style={{ opacity: 0.65 }}
              >
                <div>
                  <div className="partner-name" style={{ color: 'var(--coral)' }}>{partner.name}</div>
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
