import React from 'react';

const PRESET_LOCATIONS = [
  { name: 'T. Nagar, Chennai (Central)', lat: 13.0400, lng: 80.2300 },
  { name: 'Guindy, Chennai (South)', lat: 13.0067, lng: 80.2020 },
  { name: 'Ambattur, Chennai (North-West)', lat: 13.1143, lng: 80.1548 },
  { name: 'Kanchipuram District', lat: 12.8342, lng: 79.7036 },
  { name: 'Chengalpattu Town', lat: 12.6841, lng: 79.9836 },
];

export default function ProfileForm({ profile, onChange, onSubmit, t }) {
  const handleChange = (field, value) => {
    onChange({ ...profile, [field]: value });
  };

  const handleLocationPresetChange = (e) => {
    const idx = parseInt(e.target.value, 10);
    if (!isNaN(idx) && PRESET_LOCATIONS[idx]) {
      const loc = PRESET_LOCATIONS[idx];
      onChange({ ...profile, userLat: loc.lat, userLng: loc.lng, locationName: loc.name });
    }
  };

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onChange({
            ...profile,
            userLat: pos.coords.latitude,
            userLng: pos.coords.longitude,
            locationName: 'My GPS Location',
          });
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
        }
      );
    }
  };

  return (
    <form
      id="profile-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="form-group">
        <label htmlFor="input-project-type" className="form-label">
          {t?.labels?.projectType || 'Project Type'}
        </label>
        <select
          id="input-project-type"
          value={profile.projectType}
          onChange={(e) => handleChange('projectType', e.target.value)}
          className="form-select"
        >
          <option value="micro_business">
            {t?.options?.microBusiness || 'Micro Business / Shop / Artisan (Up to ₹1.4L)'}
          </option>
          <option value="medium_business">
            {t?.options?.mediumBusiness || 'Medium Business / Enterprise / Transport (Up to ₹50L)'}
          </option>
          <option value="education">
            {t?.options?.higherEducation || 'Higher Professional / Technical Education'}
          </option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="input-project-cost" className="form-label">
          {t?.labels?.projectCost || 'Estimated Project Cost (₹)'}
        </label>
        <input
          type="number"
          id="input-project-cost"
          value={profile.projectCost}
          onChange={(e) => handleChange('projectCost', Number(e.target.value))}
          step="5000"
          min="10000"
          max="5000000"
          className="form-input font-mono"
          required
        />
        <div style={{ fontSize: '11px', color: 'var(--stone-dim)', marginTop: '4px' }}>
          Formatted: ₹{Number(profile.projectCost || 0).toLocaleString('en-IN')}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="input-annual-income" className="form-label">
          {t?.labels?.annualIncome || 'Annual Family Income (₹)'}
        </label>
        <input
          type="number"
          id="input-annual-income"
          value={profile.income}
          onChange={(e) => handleChange('income', Number(e.target.value))}
          step="10000"
          min="10000"
          max="600000"
          className="form-input font-mono"
          required
        />
        <div style={{ fontSize: '11px', color: 'var(--stone-dim)', marginTop: '4px' }}>
          Formatted: ₹{Number(profile.income || 0).toLocaleString('en-IN')} (Cap: ₹5,00,000)
        </div>
      </div>

      {profile.projectType === 'education' && (
        <div className="form-group">
          <label htmlFor="input-education-status" className="form-label">
            {t?.labels?.educationStatus || 'Education Status / Course Type'}
          </label>
          <select
            id="input-education-status"
            value={profile.educationStatus}
            onChange={(e) => handleChange('educationStatus', e.target.value)}
            className="form-select"
          >
            <option value="undergraduate">{t?.options?.undergraduate || 'Undergraduate Degree'}</option>
            <option value="postgraduate">{t?.options?.postgraduate || 'Postgraduate / Doctorate'}</option>
            <option value="diploma">{t?.options?.diploma || 'Vocational / Technical Diploma'}</option>
          </select>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="input-location-preset" className="form-label">
          Applicant Location
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            id="input-location-preset"
            onChange={handleLocationPresetChange}
            className="form-select"
            defaultValue="0"
          >
            {PRESET_LOCATIONS.map((loc, idx) => (
              <option key={idx} value={idx}>
                {loc.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            id="btn-use-gps"
            onClick={handleUseLocation}
            className="btn-ghost"
            style={{ fontSize: '12px', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            📍 Use GPS
          </button>
        </div>
      </div>

      <button
        type="submit"
        id="btn-submit-profile"
        className="btn-primary"
        style={{ width: '100%', marginTop: '12px', textAlign: 'center' }}
      >
        {t?.labels?.submit || 'Recommend Scheme'} →
      </button>
    </form>
  );
}
