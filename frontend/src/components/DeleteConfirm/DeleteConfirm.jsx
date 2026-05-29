import React from 'react';

export default function DeleteConfirm({ open, title, message, details, onCancel, onConfirm, confirmLabel = 'Delete', cancelLabel = 'Cancel' }) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(2,6,12,0.55)', zIndex: 1500 }}>
      <div style={{ width: 'min(640px, 96%)' }}>
        <section className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{title || 'Confirm deletion'}</h3>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: 'var(--muted)' }}>{message}</p>
            {details && <div style={{ marginTop: '0.8rem', fontFamily: 'monospace', color: 'var(--ink)' }}>{details}</div>}

            <div className="cta-row" style={{ justifyContent: 'flex-end', marginTop: '1.2rem' }}>
              <button className="ghost-btn" onClick={onCancel}>{cancelLabel}</button>
              <button className="primary-btn" onClick={onConfirm} style={{ marginLeft: '0.6rem' }}>{confirmLabel}</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
