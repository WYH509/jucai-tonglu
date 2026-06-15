import { NextRequest, NextResponse } from "next/server";
import { queryAllMaterials, createMaterial } from "@/lib/cloudbase";

export const dynamic = "force-dynamic";

/** GET /api/renovation/materials — 获取全部主材 */
export async function GET() {
  try {
    const materials = await queryAllMaterials();
    return NextResponse.json({ materials });
  } catch (err: any) {
    console.error("[API] GET /api/renovation/materials error:", err);
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}

/** POST /api/renovation/materials — 创建主材 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = await createMaterial(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err: any) {
    console.error("[API] POST /api/renovation/materials error:", err);
    return NextResponse.json({ error: err.message || "创建失败" }, { status: 500 });
  }
}
