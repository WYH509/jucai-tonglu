import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/cloudbase";

// ──────────────────────────────────────────────
// 前端所需的展示类型（统一使用中文字段名）
// 注：含 / 的属性名必须加引号
// ──────────────────────────────────────────────

export interface FundDisplayRecord {
  "日期": string;
  "金额": number;
  "份额": number;
  "类型": "分红" | "补回" | "赎回";
}

export interface FundDisplayData {
  "基金名称": string;
  "基金代码": string;
  "成立/购买日期": string;
  "购买金额": number;
  "持有份额": number;
  "当前净值": number;
  "当前市值": number;
  "累计收益率": number;
  "备注": string | null;
  "本周收益": number;
  "本月收益": number;
  "本年收益": number;
  "购买渠道": string;
  "records": FundDisplayRecord[];
}

export interface SummaryDisplayData {
  "totalAssets": number;
  "weeklyProfit": number;
  "weeklyProfitRate": number;
  "monthlyProfit": number;
  "monthlyProfitRate": number;
  "yearlyProfit": number;
  "yearlyProfitRate": number;
  "totalProfit": number;
  "totalProfitRate": number;
  "fullCaliberProfit": number;
  "fullCaliberProfitRate": number;
}

export interface DashboardDisplayData {
  "funds": FundDisplayData[];
  "summary": SummaryDisplayData;
}

// ──────────────────────────────────────────────
// 归一化：将 CloudBase / 本地数据 统一转为展示格式
// ──────────────────────────────────────────────

function normalizeFund(fund: Record<string, unknown>): FundDisplayData {
  return {
    "基金名称": (fund["基金名称"] as string) || (fund.name as string) || "",
    "基金代码": (fund["基金代码"] as string) || (fund.code as string) || "",
    "成立/购买日期":
      (fund["成立/购买日期"] as string) || (fund.purchaseDate as string) || "",
    "购买金额": (fund["购买金额"] as number) || (fund.purchaseAmount as number) || 0,
    "持有份额": (fund["持有份额"] as number) || (fund.shares as number) || 0,
    "当前净值": (fund["当前净值"] as number) || (fund.currentNav as number) || 0,
    "当前市值":
      (fund["当前市值"] as number) || (fund.currentMarketValue as number) || 0,
    "累计收益率":
      (fund["累计收益率"] as number) || (fund.cumulativeReturn as number) || 0,
    "备注": (fund["备注"] as string | null) ?? (fund.remark as string | null) ?? null,
    "本周收益": (fund["本周收益"] as number) || 0,
    "本月收益": (fund["本月收益"] as number) || 0,
    "本年收益": (fund["本年收益"] as number) || 0,
    "购买渠道": (fund["购买渠道"] as string) || "",
    "records": (fund.records as FundDisplayRecord[]) || [],
  };
}

function computeSummary(funds: FundDisplayData[]): SummaryDisplayData {
  const totalInvestment = funds.reduce((s, f) => s + f["购买金额"], 0);
  const totalAssets = funds.reduce((s, f) => s + f["当前市值"], 0);
  const totalProfit = totalAssets - totalInvestment;
  const monthlyProfit = funds.reduce((s, f) => s + f["本月收益"], 0);
  const yearlyProfit = funds.reduce((s, f) => s + f["本年收益"], 0);
  const fullCaliberProfit = funds.reduce(
    (s, f) => s + f["购买金额"] * f["累计收益率"],
    0
  );

  return {
    totalAssets,
    weeklyProfit: 0,
    weeklyProfitRate: 0,
    monthlyProfit,
    monthlyProfitRate: totalInvestment > 0 ? monthlyProfit / totalInvestment : 0,
    yearlyProfit,
    yearlyProfitRate: totalInvestment > 0 ? yearlyProfit / totalInvestment : 0,
    totalProfit,
    totalProfitRate: totalInvestment > 0 ? totalProfit / totalInvestment : 0,
    fullCaliberProfit,
    fullCaliberProfitRate:
      totalInvestment > 0 ? fullCaliberProfit / totalInvestment : 0,
  };
}

// ──────────────────────────────────────────────
// GET 处理器
// ──────────────────────────────────────────────

/**
 * GET /api/private-fund
 *
 * 返回统一展示格式的私募基金仪表盘数据。
 * 数据来源：优先 CloudBase，未配置或失败时降级到本地静态数据。
 *
 * 查询参数：
 *   - source=local  强制使用本地数据
 *
 * 响应格式：
 *   { success: true, data: { funds, summary }, fallback?, fallbackReason? }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "cloudbase";

    if (source === "local") {
      const data = buildLocalData();
      return NextResponse.json({ success: true, data });
    }

    // 检查 CloudBase 环境变量
    const envId =
      process.env.CLOUDBASE_ENV_ID ||
      process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID;

    if (!envId) {
      console.warn("[PrivateFund API] CloudBase 未配置，降级到本地数据");
      const data = buildLocalData();
      return NextResponse.json({
        success: true,
        data,
        fallback: true,
        fallbackReason: "CloudBase 未配置",
      });
    }

    // 从 CloudBase 获取数据
    const raw = await fetchDashboardData();

    // 归一化为展示格式
    const funds: FundDisplayData[] = (raw.funds || []).map((f) =>
      normalizeFund(f as unknown as Record<string, unknown>)
    );
    const summary = raw.summary ? computeSummary(funds) : computeSummary([]);

    return NextResponse.json({ success: true, data: { funds, summary } });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "获取私募基金数据失败";
    console.error("[PrivateFund API] 查询失败:", message);

    // 降级到本地数据
    try {
      const data = buildLocalData();
      return NextResponse.json({
        success: true,
        data,
        fallback: true,
        fallbackReason: message,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }
  }
}

// ──────────────────────────────────────────────
// 本地数据降级
// ──────────────────────────────────────────────

import {
  fundsData,
  getThisMonthProfit,
  getYearlyProfit,
} from "@/data/privateFundData";

function buildLocalData(): DashboardDisplayData {
  const funds: FundDisplayData[] = fundsData.map((f) => ({
    "基金名称": f["基金名称"],
    "基金代码": f["基金代码"],
    "成立/购买日期": f["成立/购买日期"],
    "购买金额": f["购买金额"],
    "持有份额": f["持有份额"],
    "当前净值": f["当前净值"],
    "当前市值": f["当前市值"],
    "累计收益率": f["累计收益率"],
    "备注": f["备注"],
    "本周收益": 0,
    "本月收益": getThisMonthProfit(f["基金名称"]),
    "本年收益": getYearlyProfit(f["基金名称"]),
    "购买渠道": "",
    "records": [],
  }));

  const summary = computeSummary(funds);
  return { funds, summary };
}
