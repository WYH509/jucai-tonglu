import { NextResponse } from "next/server";
import { countBills, createBills, createMaterials } from "@/lib/cloudbase";
import { seedBills, seedMaterials } from "@/data/renovationSeed";

/** POST /api/renovation/seed — 注入种子数据（仅当 bills 为空时） */
export async function POST() {
  try {
    const existing = await countBills();
    if (existing > 0) {
      return NextResponse.json(
        { ok: false, message: "已有数据，无需 seed", existing },
        { status: 409 }
      );
    }

    const billIds = await createBills(seedBills);
    const materialIds = await createMaterials(seedMaterials);

    return NextResponse.json({
      ok: true,
      seeded: {
        bills: billIds.length,
        materials: materialIds.length,
      },
    });
  } catch (err: any) {
    console.error("[API] POST /api/renovation/seed error:", err);
    return NextResponse.json({ error: err.message || "seed 失败" }, { status: 500 });
  }
}
