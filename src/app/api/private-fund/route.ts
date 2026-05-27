import { NextResponse } from "next/server";
import {
  fundsData,
  totalInvestment,
  totalAssets,
  calcThisMonthProfit,
  calcYearlyProfit,
  getThisMonthProfit,
  getYearlyProfit,
} from "@/data/privateFundData";

/**
 * GET /api/private-fund
 * 返回私募基金数据（本地数据源）
 */
export async function GET() {
  try {
    // 给每只基金附加计算好的收益数据
    const enriched = fundsData.map((fund) => ({
      ...fund,
      本周收益: 0, // 暂无周度数据
      本月收益: getThisMonthProfit(fund.基金名称),
      本年收益: getYearlyProfit(fund.基金名称),
    }));

    const data = {
      funds: enriched,
      summary: {
        totalInvestment,
        totalAssets,
        totalMonthlyProfit: calcThisMonthProfit(),
        totalYearlyProfit: calcYearlyProfit(),
      },
    };

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "获取私募基金数据失败";
    console.error("[PrivateFund API] GET error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
