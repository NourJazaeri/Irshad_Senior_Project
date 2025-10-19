import React from 'react';
export default function SupervisorCard({ title, value, subtitle }) {
  return (
    <div className="shadow-sm rounded-lg border bg-white p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {subtitle ? <div className="text-xs text-gray-400 mt-1">{subtitle}</div> : null}
    </div>
  );
}
