import React from 'react';
import { Link } from 'react-router-dom';

export default function Confirmed() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Thanks — your listing is confirmed</h1>
        <p className="text-gray-500 text-sm">Your availability is up to date and will continue to appear in referral searches.</p>
      </div>
    </div>
  );
}
