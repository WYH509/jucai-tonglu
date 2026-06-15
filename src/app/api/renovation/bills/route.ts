import { NextRequest, NextResponse } from "next/server";
import { queryAllBills, createBill, isCloudBaseConfigured } from "@/lib/cloudbase";
import { seedBills } from "@/data/renovationSeed";

export const dynamic = "force-dynamic";

/** GET /api/renovation/bills — 获取全部账单 */
export async function GET() {
  try {
    const bills = await queryAllBills();
    return NextResponse.json({ bills, fallback: false });
  } catch (err: any) {
    console.error("[API] GET /api/renovation/bills error:", err);
    // CloudBase 未配置时返回种子数据作为演示
    if (!isCloudBaseConfigured()) {
      return NextResponse.json({ bills: seedBills, fallback: true });
    }
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}

/** POST /api/renovation/bills — 创建账单 */
export async function POST(request: NextRequest) {
  try {
    if (!isCloudBaseConfigured()) {
      return NextResponse.json(
        { error: "CloudBase 未配置，无法写入" },
        { status: 503 }
      );
    }
    const body = await request.json();
    const id = await createBill(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err: any) {
    console.error("[API] POST /api/renovation/bills error:", err);
    return NextResponse.json({ error: err.message || "创建失败" }, { status: 500 });
  }
}
