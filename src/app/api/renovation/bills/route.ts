import { NextRequest, NextResponse } from "next/server";
import { queryAllBills, createBill } from "@/lib/cloudbase";

export const dynamic = "force-dynamic";

/** GET /api/renovation/bills — 获取全部账单 */
export async function GET() {
  try {
    const bills = await queryAllBills();
    return NextResponse.json({ bills });
  } catch (err: any) {
    console.error("[API] GET /api/renovation/bills error:", err);
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}

/** POST /api/renovation/bills — 创建账单 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = await createBill(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err: any) {
    console.error("[API] POST /api/renovation/bills error:", err);
    return NextResponse.json({ error: err.message || "创建失败" }, { status: 500 });
  }
}
