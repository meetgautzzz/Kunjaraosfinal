import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have a header row plus at least 1 vendor" },
        { status: 400 },
      );
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    const idx = (col: string) => headers.indexOf(col);

    const vendorRows = lines.slice(1).map((line) => {
      // Simple CSV split — sufficient for the template columns which don't embed commas
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const rating = parseInt(values[idx("rating")] || "4", 10);
      const events_done = parseInt(values[idx("events_done")] || "0", 10);
      return {
        name:        values[idx("name")]        || "",
        category:    values[idx("category")]    || "Other",
        phone:       values[idx("phone")]       || "",
        email:       values[idx("email")]       || "",
        city:        values[idx("city")]        || "",
        price_range: values[idx("price_range")] || "",
        rating:      Number.isFinite(rating)  ? Math.min(5, Math.max(1, rating)) : 4,
        notes:       values[idx("notes")]       || "",
        events_done: Number.isFinite(events_done) ? Math.max(0, events_done) : 0,
      };
    });

    const valid = vendorRows.filter((v) => v.name.length > 0);
    if (valid.length === 0) {
      return NextResponse.json({ error: "No valid vendors found in CSV (name column required)" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("vendors")
      .insert(
        valid.map((v) => ({
          ...v,
          user_id:    auth.user.id,
          active:     true,
          created_at: now,
          updated_at: now,
        })),
      )
      .select();

    if (error) {
      console.error("[vendors/import] Supabase error:", error);
      return NextResponse.json({ error: "Failed to import vendors" }, { status: 500 });
    }

    return NextResponse.json({
      success:  true,
      imported: data?.length ?? 0,
      skipped:  vendorRows.length - valid.length,
      vendors:  data,
    });
  } catch (err: any) {
    console.error("[vendors/import] Unexpected error:", err);
    return NextResponse.json({ error: err?.message ?? "Import failed" }, { status: 500 });
  }
}
