import { NextRequest, NextResponse } from "next/server";
import { updateMaterial, deleteMaterial, isCloudBaseConfigured } from "@/lib/cloudbase";

/** PUT /api/renovation/materials/:id — 更新主材 */
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
    await updateMaterial(id, body);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[API] PUT /api/renovation/materials/:id error:", err);
    return NextResponse.json({ error: err.message || "更新失败" }, { status: 500 });
  }
}

/** DELETE /api/renovation/materials/:id — 删除主材 */
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
    await deleteMaterial(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[API] DELETE /api/renovation/materials/:id error:", err);
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}
