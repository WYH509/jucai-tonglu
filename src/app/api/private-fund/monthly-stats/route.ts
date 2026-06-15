import { NextRequest, NextResponse } from "next/server";
import {
  calculateMonthlyReturnRates,
  getAllMonths,
} from "@/data/navStore";
import { fundsData } from "@/data/privateFundData";

/**
 * GET /api/private-fund/monthly-stats
 *
 * 可选查询参数:
 *   - year=2026  筛选年份（默认全部）
 *
 * 返回: { success: true, data: { funds, rates, months, profitData } }
 *   - funds: FundInfo[]
 *   - rates: { "基金名": { "1月": 0.12, ... } } (收益率)
 *   - months: string[] (排序后的月份列表)
 *   - profitData: { "基金名": { "1月": 12345, ... } } (收益金额)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || "2026";

    // 计算收益率
    const rates = calculateMonthlyReturnRates();
    const months = getAllMonths();

    // 同时返回收益金额数据
    const { monthlyProfitData } = await import("@/data/privateFundData");

    return NextResponse.json({
      success: true,
      data: {
        funds: fundsData,
        rates,
        months,
        profitData: JSON.parse(JSON.stringify(monthlyProfitData)),
        year,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "查询月度统计失败";
    console.error("[MonthlyStats API] GET error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
