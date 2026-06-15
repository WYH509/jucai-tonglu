"use client";

import { useState, useRef } from "react";
import type { RenovationBill, BillCategory } from "@/types/renovation";

interface Props {
  bills: RenovationBill[];
  onEdit: (bill: RenovationBill) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

const CATEGORY_COLORS: Record<BillCategory, string> = {
  "硬装": "bg-blue-100 text-blue-700",
  "软装": "bg-emerald-100 text-emerald-700",
  "家电": "bg-amber-100 text-amber-700",
  "工程": "bg-purple-100 text-purple-700",
  "设计费": "bg-pink-100 text-pink-700",
  "其他": "bg-zinc-100 text-zinc-700",
};

const PAY_STATUS_BADGES: Record<string, string> = {
  "已付款": "bg-green-100 text-green-700",
  "待付款": "bg-amber-100 text-amber-700",
  "已退款": "bg-red-100 text-red-700",
};

function fmt(n: number): string {
  return n.toLocaleString("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function groupByDate(bills: RenovationBill[]): Map<string, RenovationBill[]> {
  const map = new Map<string, RenovationBill[]>();
  for (const b of bills) {
    const key = b.payDate;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
  }
  return map;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const wd = weekdays[d.getDay()];
  return `${month}月${day}日 周${wd}`;
}

export default function BillList({ bills, onEdit, onDelete, loading }: Props) {
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const touchStartX = useRef(0);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-zinc-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-zinc-400">
        <span className="text-5xl mb-4">📋</span>
        <p className="text-sm">暂无账单记录</p>
      </div>
    );
  }

  const grouped = groupByDate(bills);

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([date, items]) => {
        const subTotal = items.reduce((s, b) => s + b.amount, 0);
        return (
          <div key={date}>
            <div className="flex justify-between items-center px-1 py-2">
              <span className="text-xs font-medium text-zinc-500">{formatDateLabel(date)}</span>
              <span className="text-xs font-semibold text-zinc-600">{fmt(subTotal)}</span>
            </div>
            <div className="space-y-2">
              {items.map((bill) => (
                <div
                  key={bill._id}
                  className="relative overflow-hidden rounded-xl"
                  onTouchStart={(e) => {
                    touchStartX.current = e.touches[0].clientX;
                  }}
                  onTouchEnd={(e) => {
                    const diff = touchStartX.current - e.changedTouches[0].clientX;
                    if (diff > 60 && bill._id) {
                      setSwipingId(bill._id);
                    } else {
                      setSwipingId(null);
                    }
                  }}
                >
                  {/* 删除按钮（滑动露出） */}
                  {bill._id && swipingId === bill._id && (
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        onClick={() => {
                          onDelete(bill._id!);
                          setSwipingId(null);
                        }}
                        className="h-full bg-red-500 text-white px-6 text-sm font-medium rounded-r-xl"
                      >
                        删除
                      </button>
                    </div>
                  )}
                  {/* 主内容 */}
                  <div
                    className={`bg-white border border-zinc-100 rounded-xl p-3 transition-transform ${
                      swipingId === bill._id ? "-translate-x-20" : ""
                    }`}
                    onClick={() => onEdit(bill)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-zinc-900 truncate">
                            {bill.name}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[bill.category]}`}>
                            {bill.category}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PAY_STATUS_BADGES[bill.payStatus]}`}>
                            {bill.payStatus}
                          </span>
                        </div>
                        {bill.notes && (
                          <p className="text-xs text-zinc-400 mt-1 truncate">{bill.notes}</p>
                        )}
                      </div>
                      <span className="text-base font-bold text-zinc-900 shrink-0">
                        {fmt(bill.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
