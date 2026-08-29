/**
 * partnerFilter.js — NPA/Utilization Filter + Haversine Distance Ranking
 *
 * Pure function: filters channel-partners.json by loan category
 * and financial health thresholds, then ranks survivors by
 * straight-line distance (Haversine) from the user's location.
 *
 * Zero LLM involvement. Zero side effects.
 */

import partners from "../data/channel-partners.json" with { type: "json" };

// ── Constants ───────────────────────────────────────────────────────
const EARTH_RADIUS_KM = 6371;
const DEFAULT_NPA_THRESHOLD = 8.0;          // NPA% above this = unhealthy
const DEFAULT_UTILIZATION_THRESHOLD = 50.0; // Utilization% below this = poor

/**
 * @param {Object} params
 * @param {number} params.userLat              — User's latitude
 * @param {number} params.userLng              — User's longitude
 * @param {string} params.loanCategory         — One of: "micro_finance", "term_loan", "education"
 * @param {number} [params.npaThreshold=8.0]   — Max acceptable NPA% (partners above this are excluded)
 * @param {number} [params.utilizationThreshold=50.0] — Min acceptable fund utilization% (partners below this are excluded)
 *
 * @returns {{
 *   eligible: Array<Object>,
 *   excluded: Array<Object>,
 *   totalPartners: number,
 *   filters: { loanCategory: string, npaThreshold: number, utilizationThreshold: number }
 * }}
 *   - eligible: partners that pass all filters, sorted by distance (nearest first)
 *     Each partner object is augmented with `distanceKm` and `healthStatus`
 *   - excluded: partners that failed at least one filter, with `exclusionReasons`
 */
export function findEligiblePartners({
  userLat,
  userLng,
  loanCategory,
  npaThreshold = DEFAULT_NPA_THRESHOLD,
  utilizationThreshold = DEFAULT_UTILIZATION_THRESHOLD,
}) {
  const eligible = [];
  const excluded = [];

  for (const partner of partners) {
    const reasons = [];

    // ── Filter 1: Does this partner serve the required loan category? ──
    if (!partner.categoriesServed.includes(loanCategory)) {
      reasons.push({
        code: "CATEGORY_NOT_SERVED",
        detail: `Partner does not serve "${loanCategory}". Serves: ${partner.categoriesServed.join(", ")}`,
      });
    }

    // ── Filter 2: NPA health check ─────────────────────────────────────
    if (partner.npaRate > npaThreshold) {
      reasons.push({
        code: "NPA_TOO_HIGH",
        detail: `NPA rate ${partner.npaRate}% exceeds threshold ${npaThreshold}%`,
      });
    }

    // ── Filter 3: Fund utilization check ───────────────────────────────
    if (partner.fundUtilization < utilizationThreshold) {
      reasons.push({
        code: "UTILIZATION_TOO_LOW",
        detail: `Fund utilization ${partner.fundUtilization}% is below threshold ${utilizationThreshold}%`,
      });
    }

    // ── Compute distance regardless (useful for excluded list context) ─
    const distanceKm = haversineDistance(userLat, userLng, partner.latitude, partner.longitude);

    const augmentedPartner = {
      ...partner,
      distanceKm: Math.round(distanceKm * 10) / 10, // 1 decimal place
      healthStatus: partner.npaRate <= npaThreshold && partner.fundUtilization >= utilizationThreshold
        ? "healthy"
        : "unhealthy",
    };

    if (reasons.length === 0) {
      eligible.push(augmentedPartner);
    } else {
      excluded.push({ ...augmentedPartner, exclusionReasons: reasons });
    }
  }

  // ── Sort eligible partners by distance (nearest first) ────────────
  eligible.sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    eligible,
    excluded,
    totalPartners: partners.length,
    filters: { loanCategory, npaThreshold, utilizationThreshold },
  };
}

/**
 * Haversine formula — calculates the great-circle distance between
 * two GPS coordinate pairs on Earth's surface.
 *
 * @param {number} lat1 — Latitude of point A (degrees)
 * @param {number} lng1 — Longitude of point A (degrees)
 * @param {number} lat2 — Latitude of point B (degrees)
 * @param {number} lng2 — Longitude of point B (degrees)
 * @returns {number}    — Distance in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}
