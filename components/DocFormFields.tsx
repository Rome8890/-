'use client';

import React from 'react';

export const baseInputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: '15px',
  border: '1.5px solid #c5c4db', borderRadius: '10px',
  outline: 'none', color: '#191c1d', background: '#fafafa', fontFamily: 'inherit',
};

export function Field({ label, hint, required, warn, children }: {
  label: string; hint?: string; required?: boolean; warn?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#454558', marginBottom: '6px' }}>
        {label}
        {required && <span style={{ color: '#ba1a1a', marginLeft: '3px' }}>*</span>}
        {hint && <span style={{ fontWeight: 400, color: '#9a99b0', marginLeft: '6px', fontSize: '11px' }}>{hint}</span>}
      </label>
      {children}
      {warn && <p style={{ fontSize: '11px', color: '#ba1a1a', marginTop: '4px' }}>{warn}</p>}
    </div>
  );
}

export function SectionHead({ label }: { label: string }) {
  return (
    <p style={{ fontSize: '11px', fontWeight: 700, color: '#0001bb', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '20px 0 12px' }}>
      {label}
    </p>
  );
}

export function Input({ value, onChange, placeholder, style }: {
  value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...baseInputStyle, ...style }}
      onFocus={e => (e.target.style.borderColor = '#0001bb')}
      onBlur={e => (e.target.style.borderColor = '#c5c4db')}
    />
  );
}
