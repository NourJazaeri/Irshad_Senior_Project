import React from 'react';

export default function GroupCard({ name, count, department, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border p-5 hover:shadow"
    >
      <div className="text-lg font-semibold">{name}</div>
      <div className="mt-1 text-sm opacity-70">{department || '—'}</div>
      <div className="mt-2 text-sm">{count} Trainees</div>
    </button>
  );
}
