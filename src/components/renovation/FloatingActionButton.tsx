"use client";

import { useState } from "react";

interface Props {
  onAddBill: () => void;
  onAddMaterial: () => void;
}

export default function FloatingActionButton({ onAddBill, onAddMaterial }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <>
          <button
            onClick={() => {
              setOpen(false);
              onAddBill();
            }}
            className="flex items-center gap-2 rounded-full bg-white shadow-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-all"
          >
            <span className="text-lg">📝</span> 新增账单
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onAddMaterial();
            }}
            className="flex items-center gap-2 rounded-full bg-white shadow-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-all"
          >
            <span className="text-lg">🧱</span> 新增主材
          </button>
        </>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-500 text-white shadow-xl hover:bg-blue-600 active:scale-95 transition-all"
      >
        <svg
          className={`w-7 h-7 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
}
