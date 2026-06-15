"use client";

import type { WarrantyExpiringItem } from "@/types/renovation";

interface Props {
  items: WarrantyExpiringItem[];
}

export default function WarrantyAlerts({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2 text-red-600 font-medium text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        保修即将到期
      </div>
      {items.map((item) => (
        <div
          key={item.name + item.warrantyUntil}
          className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3"
        >
          <div>
            <span className="text-sm font-medium text-red-800">{item.name}</span>
            <span className="text-xs text-red-600 ml-2">
              {item.warrantyUntil} 到期
            </span>
          </div>
          <span className="text-sm font-bold text-red-600">
            {item.daysLeft === 0 ? "今天" : `${item.daysLeft}天后`}
          </span>
        </div>
      ))}
    </div>
  );
}
