import { NextResponse } from "next/server";
import { queryAllBills, queryAllMaterials, isCloudBaseConfigured } from "@/lib/cloudbase";
import { seedBills, seedMaterials } from "@/data/renovationSeed";
import type { RenovationSummary, MonthlyTrendItem, WarrantyExpiringItem, RenovationBill, RenovationMaterial } from "@/types/renovation";

export const dynamic = "force-dynamic";

function computeSummary(bills: RenovationBill[], materials: RenovationMaterial[]): RenovationSummary {
  const billCount = bills.length;
  const totalSpent = bills
    .filter((b) => b.payStatus !== "已退款")
    .reduce((s, b) => s + b.amount, 0);
  const totalPaid = bills
    .filter((b) => b.payStatus === "已付款")
    .reduce((s, b) => s + b.amount, 0);
  const totalPending = bills
    .filter((b) => b.payStatus === "待付款")
    .reduce((s, b) => s + b.amount, 0);
  const totalRefunded = bills
    .filter((b) => b.payStatus === "已退款")
    .reduce((s, b) => s + b.amount, 0);

  const payProgress =
    totalPaid + totalPending > 0
      ? totalPaid / (totalPaid + totalPending)
      : 0;

  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthSpent = bills
    .filter((b) => b.payDate.startsWith(thisMonthPrefix) && b.payStatus !== "已退款")
    .reduce((s, b) => s + b.amount, 0);

  const categoryNames = ["硬装", "软装", "家电", "工程", "设计费", "其他"] as const;
  const categoryBreakdown: Record<string, number> = {};
  for (const cat of categoryNames) {
    categoryBreakdown[cat] = bills
      .filter((b) => b.category === cat && b.payStatus !== "已退款")
      .reduce((s, b) => s + b.amount, 0);
  }

  const monthlyTrend: MonthlyTrendItem[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const total = bills
      .filter((b) => b.payDate.startsWith(ym) && b.payStatus !== "已退款")
      .reduce((s, b) => s + b.amount, 0);
    monthlyTrend.push({ month: ym, total });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const warrantyExpiring: WarrantyExpiringItem[] = [];
  for (const m of materials) {
    if (!m.warrantyUntil) continue;
    const expiry = new Date(m.warrantyUntil);
    expiry.setHours(0, 0, 0, 0);
    const diffMs = expiry.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysLeft >= 0 && daysLeft <= 30) {
      warrantyExpiring.push({
        name: m.name,
        warrantyUntil: m.warrantyUntil,
        daysLeft,
      });
    }
  }

  return {
    totalSpent,
    totalPaid,
    totalPending,
    totalRefunded,
    payProgress: Math.round(payProgress * 1000) / 1000,
    thisMonthSpent,
    billCount,
    categoryBreakdown,
    monthlyTrend,
    warrantyExpiring,
  };
}

/** GET /api/renovation/summary — 聚合统计 */
export async function GET() {
  try {
    const [bills, materials] = await Promise.all([
      queryAllBills(),
      queryAllMaterials(),
    ]);
    const summary = computeSummary(bills, materials);
    return NextResponse.json({ ...summary, fallback: false });
  } catch (err: any) {
    console.error("[API] GET /api/renovation/summary error:", err);
    // CloudBase 未配置时用种子数据计算统计
    if (!isCloudBaseConfigured()) {
      const summary = computeSummary(seedBills as RenovationBill[], seedMaterials as RenovationMaterial[]);
      return NextResponse.json({ ...summary, fallback: true });
    }
    return NextResponse.json({ error: err.message || "统计失败" }, { status: 500 });
  }
}
