import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';
import WebPortalCTA from '../components/safe/WebPortalCTA';

export default function MobileBillingInfo() {
  return (
    <div className="container mx-auto px-4 py-16 flex justify-center min-h-[70vh] items-center">
      <div className="w-full max-w-md bg-[var(--card-bg)] p-8 rounded-2xl shadow-lg border border-[var(--card-border)] text-center">
        <div className="flex justify-center mb-6 text-crown-dark opacity-80">
          <FaShieldAlt size={48} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)] mb-4">
          Secure Membership Management
        </h2>
        <p className="text-[var(--text-secondary)] mb-8">
          Membership management is securely handled through the Crownside web portal.
        </p>
        
        <WebPortalCTA url="https://thecrownside.com/settings/billing" text="Open Crownside Web Portal" />
        
        <p className="text-xs text-gray-400 mt-6 mt-8 border-t pt-4">
          Return to the app after updating your settings.
        </p>
      </div>
    </div>
  );
}
