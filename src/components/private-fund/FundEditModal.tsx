"use client";

import { useState } from "react";
import type {
  FundDisplayData,
  FundDisplayRecord,
} from "./PrivateFundDashboard";

// ---------- Format Helpers ----------

function fmtAmount(n: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// ---------- Props ----------

interface Props {
  fund: FundDisplayData;
  onClose: () => void;
  onSave: (data: FundDisplayData) => void;
}

// ---------- Empty Record ----------

function emptyRecord(): FundDisplayRecord {
  return { "日期": "", "金额": 0, "份额": 0, "类型": "补回" };
}

// ---------- Component ----------

export default function FundEditModal({ fund, onClose, onSave }: Props) {
  const [form, setForm] = useState<FundDisplayData>(() => ({
    ...fund,
    records: fund.records?.length ? [...fund.records] : [],
  }));

  const [saving, setSaving] = useState(false);

  // ---------- Field updaters ----------

  const setCnField = (
    field: "基金名称" | "基金代码" | "成立/购买日期" | "备注" | "购买渠道",
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setNumField = (
    field: "购买金额" | "持有份额" | "当前净值" | "当前市值" | "累计收益率" | "本周收益" | "本月收益" | "本年收益",
    value: number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ---------- Record Handlers ----------

  const addRecord = () => {
    setForm((prev) => ({
      ...prev,
      records: [...prev.records, emptyRecord()],
    }));
  };

  const updateRecord = (
    index: number,
    field: keyof FundDisplayRecord,
    value: string | number
  ) => {
    setForm((prev) => {
      const records = [...prev.records];
      records[index] = { ...records[index], [field]: value };
      return { ...prev, records };
    });
  };

  const removeRecord = (index: number) => {
    setForm((prev) => ({
      ...prev,
      records: prev.records.filter((_, i) => i !== index),
    }));
  };

  // ---------- Submit ----------

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  // ---------- Render ----------

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full sm:max-w-lg max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl overflow-y-auto shadow-xl">
        {/* Close handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">编辑基金信息</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* ──────── 基础信息 ──────── */}
          <section>
            <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
              基础信息
            </h3>
            <div className="rounded-2xl bg-gray-50 p-4 space-y-4">
              <FormField
                label="基金名称"
                value={form["基金名称"]}
                readOnly
              />
              <FormField
                label="基金代码"
                value={form["基金代码"]}
                readOnly
              />
              <FormField
                label="购买日期"
                type="date"
                value={form["成立/购买日期"]}
                onChange={(v) => setCnField("成立/购买日期", v)}
              />
              <FormField
                label="购买金额 (元)"
                type="number"
                value={String(form["购买金额"])}
                onChange={(v) => setNumField("购买金额", Number(v))}
              />
              <FormField
                label="持有份额"
                type="number"
                value={String(form["持有份额"])}
                onChange={(v) => setNumField("持有份额", Number(v))}
              />
              <FormField
                label="当前净值"
                type="number"
                step="0.0001"
                value={String(form["当前净值"])}
                onChange={(v) => setNumField("当前净值", Number(v))}
              />
              <FormField
                label="当前市值 (元)"
                type="number"
                value={String(form["当前市值"])}
                onChange={(v) => setNumField("当前市值", Number(v))}
              />
              <FormField
                label="累计收益率 (小数)"
                type="number"
                step="0.0001"
                value={String(form["累计收益率"])}
                onChange={(v) => setNumField("累计收益率", Number(v))}
              />
              <FormField
                label="购买渠道"
                value={form["购买渠道"]}
                onChange={(v) => setCnField("购买渠道", v)}
                placeholder="如：招商证券、天天基金"
              />
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  备注
                </label>
                <textarea
                  value={form["备注"] || ""}
                  onChange={(e) =>
                    setCnField("备注", e.target.value || "")
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none"
                  rows={3}
                  placeholder="备注信息（可选）"
                />
              </div>
            </div>
          </section>

          {/* ──────── 收益数据 ──────── */}
          <section>
            <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
              收益数据
            </h3>
            <div className="rounded-2xl bg-gray-50 p-4 space-y-4">
              <FormField
                label="本周收益 (元)"
                type="number"
                value={String(form["本周收益"])}
                onChange={(v) => setNumField("本周收益", Number(v))}
              />
              <FormField
                label="本月收益 (元)"
                type="number"
                value={String(form["本月收益"])}
                onChange={(v) => setNumField("本月收益", Number(v))}
              />
              <FormField
                label="本年收益 (元)"
                type="number"
                value={String(form["本年收益"])}
                onChange={(v) => setNumField("本年收益", Number(v))}
              />
            </div>
          </section>

          {/* ──────── 交易记录 ──────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                交易记录
              </h3>
              <button
                onClick={addRecord}
                className="text-xs text-blue-500 font-medium hover:text-blue-600"
              >
                + 添加
              </button>
            </div>

            {form.records.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 p-4 text-center text-sm text-gray-400">
                暂无交易记录
              </div>
            ) : (
              <div className="space-y-3">
                {form.records.map((record, i) => (
                  <RecordFormRow
                    key={i}
                    record={record}
                    index={i}
                    onChange={updateRecord}
                    onRemove={removeRecord}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ──────── 底部按钮 ──────── */}
          <div className="flex gap-3 pt-2 pb-4">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 h-11 rounded-xl bg-blue-500 text-white text-sm font-medium shadow-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "保存中..." : "保存修改"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

interface FormFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: "text" | "number" | "date";
  step?: string;
  placeholder?: string;
  readOnly?: boolean;
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  step,
  placeholder,
  readOnly,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 ${
          readOnly ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}

interface RecordFormRowProps {
  record: FundDisplayRecord;
  index: number;
  onChange: (index: number, field: keyof FundDisplayRecord, value: string | number) => void;
  onRemove: (index: number) => void;
}

const recordTypes: FundDisplayRecord["类型"][] = ["分红", "补回", "赎回"];

function RecordFormRow({
  record,
  index,
  onChange,
  onRemove,
}: RecordFormRowProps) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4 space-y-3 relative">
      <button
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-400 hover:bg-red-200 transition-colors"
        aria-label="删除记录"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="pr-6">
        <label className="block text-xs text-gray-400 mb-1.5">类型</label>
        <div className="flex gap-2">
          {recordTypes.map((t) => (
            <button
              key={t}
              onClick={() => onChange(index, "类型", t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                record["类型"] === t
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">日期</label>
          <input
            type="date"
            value={record["日期"]}
            onChange={(e) => onChange(index, "日期", e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">金额</label>
          <input
            type="number"
            value={record["金额"] || ""}
            onChange={(e) => onChange(index, "金额", Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">份额</label>
          <input
            type="number"
            value={record["份额"] || ""}
            onChange={(e) => onChange(index, "份额", Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );
}
