import React from 'react';
import { openExternal } from '../../lib/openExternal';
import { FaExternalLinkAlt } from 'react-icons/fa';

export default function WebPortalCTA({
  url = 'https://thecrownside.com',
  text = 'Manage Membership Online',
  className = ''
}) {
  const handleOpen = (e) => {
    e.preventDefault();
    openExternal(url);
  };

  return (
    <div className={`p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-sm text-center ${className}`}>
      <h3 className="font-serif font-bold text-xl mb-3 text-[var(--text-primary)]">
        Web Portal Access
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Membership and billing management is available through the Crownside web portal.
      </p>
      <button
        onClick={handleOpen}
        className="btn-primary w-full py-3 rounded-full flex items-center justify-center gap-2 bg-crown-dark text-white hover:bg-black transition-colors"
      >
        {text} <FaExternalLinkAlt size={14} />
      </button>
    </div>
  );
}
