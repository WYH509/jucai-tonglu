import { NextResponse } from "next/server";
import { queryAllBills, queryAllMaterials } from "@/lib/cloudbase";
import type { RenovationSummary, MonthlyTrendItem, WarrantyExpiringItem } from "@/types/renovation";

export const dynamic = "force-dynamic";

/** GET /api/renovation/summary — 聚合统计 */
export async function GET() {
  try {
    const [bills, materials] = await Promise.all([
      queryAllBills(),
      queryAllMaterials(),
    ]);

    // ── 金额聚合 ──
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

    // ── 本月支出 ──
    const now = new Date();
    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonthSpent = bills
      .filter((b) => b.payDate.startsWith(thisMonthPrefix) && b.payStatus !== "已退款")
      .reduce((s, b) => s + b.amount, 0);

    // ── 分类聚合 ──
    const categoryNames = ["硬装", "软装", "家电", "工程", "设计费", "其他"] as const;
    const categoryBreakdown: Record<string, number> = {};
    for (const cat of categoryNames) {
      categoryBreakdown[cat] = bills
        .filter((b) => b.category === cat && b.payStatus !== "已退款")
        .reduce((s, b) => s + b.amount, 0);
    }

    // ── 月度趋势（最近 6 个月） ──
    const monthlyTrend: MonthlyTrendItem[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const total = bills
        .filter((b) => b.payDate.startsWith(ym) && b.payStatus !== "已退款")
        .reduce((s, b) => s + b.amount, 0);
      monthlyTrend.push({ month: ym, total });
    }

    // ── 保修提醒（30 天内到期） ──
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

    const summary: RenovationSummary = {
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

    return NextResponse.json(summary);
  } catch (err: any) {
    console.error("[API] GET /api/renovation/summary error:", err);
    return NextResponse.json({ error: err.message || "统计失败" }, { status: 500 });
  }
}
