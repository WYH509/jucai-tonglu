import { NextRequest, NextResponse } from "next/server";
import {
  listPrivateFundRecords,
  createPrivateFundRecord,
} from "@/lib/feishu";

/**
 * GET /api/private-fund
 * 返回私募基金列表
 */
export async function GET() {
  try {
    const data = await listPrivateFundRecords();
    return NextResponse.json({ success: true, data: data.data?.items || [] });
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

/**
 * POST /api/private-fund
 * 创建新的私募基金记录
 * Body: { 基金名称, 购买日期, 购买金额 }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fundName, purchaseDate, purchaseAmount } = body;

    if (!fundName || !purchaseDate || !purchaseAmount) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必填字段：基金名称、购买日期、购买金额",
        },
        { status: 400 }
      );
    }

    const fields: Record<string, unknown> = {
      基金名称: fundName,
      购买日期: purchaseDate,
      购买金额: Number(purchaseAmount),
    };

    const result = await createPrivateFundRecord(fields);
    return NextResponse.json({ success: true, data: result.data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "创建私募基金记录失败";
    console.error("[PrivateFund API] POST error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
