import React from 'react';

export type CampaignStatus = 'pending' | 'active' | 'ended';

export default function StatusBadge({ status }: { status: CampaignStatus }) {
  const map: Record<CampaignStatus, { label: string; cls: string }> = {
    pending: { label: 'Sắp diễn ra', cls: 'bg-blue-100 text-blue-700' },
    active:  { label: 'Đang diễn ra', cls: 'bg-green-100 text-green-700' },
    ended:   { label: 'Kết thúc', cls: 'bg-red-100 text-red-700' },
  };
  const s = map[status] ?? { label: 'Khác', cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
