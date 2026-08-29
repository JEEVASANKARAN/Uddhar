import React from 'react';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
];

export default function LanguageSwitcher({ currentLang, onChangeLang }) {
  return (
    <div id="language-switcher" className="flex items-center gap-1 bg-[#0C0F1E] border border-[rgba(243,239,230,0.10)] rounded p-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          id={`lang-btn-${lang.code}`}
          onClick={() => onChangeLang(lang.code)}
          className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
            currentLang === lang.code
              ? 'bg-[#E3A83B] text-[#0C0F1E] font-semibold'
              : 'text-[#9A9284] hover:text-[#F3EFE6]'
          }`}
          style={{
            background: currentLang === lang.code ? 'var(--gold)' : 'transparent',
            color: currentLang === lang.code ? 'var(--bg-deep)' : 'var(--stone)',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 10px',
            fontSize: '12px',
            fontFamily: 'IBM Plex Mono, monospace',
            borderRadius: '3px'
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
