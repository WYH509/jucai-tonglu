import { NextRequest, NextResponse } from "next/server";
import {
  listNavRecords,
  getLatestNavRecord,
  saveNavRecord,
} from "@/data/navStore";
import { fundsData } from "@/data/privateFundData";

/**
 * GET /api/private-fund/nav
 *
 * 查询参数:
 *   - latest=true  只返回最新一条记录
 *
 * 返回: { success: true, data: { records: NavRecord[], fundNames: string[] } }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latest = searchParams.get("latest") === "true";

    if (latest) {
      const record = await getLatestNavRecord();
      return NextResponse.json({
        success: true,
        data: {
          record,
          fundNames: fundsData.map((f) => f["基金名称"]),
        },
      });
    }

    const records = await listNavRecords();
    return NextResponse.json({
      success: true,
      data: {
        records,
        fundNames: fundsData.map((f) => f["基金名称"]),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "查询净值记录失败";
    console.error("[Nav API] GET error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/private-fund/nav
 *
 * Body:
 *   { date: "YYYY-MM-DD", values: { "基金名称": 净值 | "" } }
 *
 * 保存逻辑：
 *   - 已填写字段 → 使用新值
 *   - 未填写字段（""）→ 沿用上次记录该基金净值
 *   - 同日期已存在 → 覆盖
 *   - 无历史 → 取 fundsData 当前净值
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, values } = body as {
      date: string;
      values: Record<string, number | "">;
    };

    if (!date) {
      return NextResponse.json(
        { success: false, error: "日期不能为空" },
        { status: 400 }
      );
    }

    if (!values || Object.keys(values).length === 0) {
      return NextResponse.json(
        { success: false, error: "净值数据不能为空" },
        { status: 400 }
      );
    }

    const record = await saveNavRecord(date, values);

    return NextResponse.json({ success: true, data: { record } });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "保存净值记录失败";
    console.error("[Nav API] POST error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
