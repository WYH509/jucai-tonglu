import { NextRequest, NextResponse } from "next/server";
import { updateBill, deleteBill, isCloudBaseConfigured } from "@/lib/cloudbase";

/** PUT /api/renovation/bills/:id — 更新账单 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isCloudBaseConfigured()) {
      return NextResponse.json(
        { error: "CloudBase 未配置，无法写入" },
        { status: 503 }
      );
    }
    const { id } = await params;
    const body = await request.json();
    await updateBill(id, body);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[API] PUT /api/renovation/bills/:id error:", err);
    return NextResponse.json({ error: err.message || "更新失败" }, { status: 500 });
  }
}

/** DELETE /api/renovation/bills/:id — 删除账单 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isCloudBaseConfigured()) {
      return NextResponse.json(
        { error: "CloudBase 未配置，无法写入" },
        { status: 503 }
      );
    }
    const { id } = await params;
    await deleteBill(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[API] DELETE /api/renovation/bills/:id error:", err);
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}
