import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
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

    const { data: rows, errors, meta } = Papa.parse<Record<string, string>>(text, {
      header:           true,   // first row = column names
      skipEmptyLines:   true,
      transformHeader:  (h) => h.trim().toLowerCase(),
      transform:        (v) => v.trim(),
    });

    if (errors.length > 0 && rows.length === 0) {
      return NextResponse.json(
        { error: `CSV parse error: ${errors[0].message}` },
        { status: 400 },
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "CSV must have a header row plus at least 1 vendor" },
        { status: 400 },
      );
    }

    const vendorRows = rows.map((row) => {
      const rating     = parseInt(row.rating      || "4", 10);
      const eventsDone = parseInt(row.events_done || "0", 10);
      return {
        name:        row.name        || "",
        category:    row.category    || "Other",
        phone:       row.phone       || "",
        email:       row.email       || "",
        city:        row.city        || "",
        price_range: row.price_range || "",
        rating:      Number.isFinite(rating)     ? Math.min(5, Math.max(1, rating))  : 4,
        notes:       row.notes       || "",
        events_done: Number.isFinite(eventsDone) ? Math.max(0, eventsDone)           : 0,
      };
    });

    const valid   = vendorRows.filter((v) => v.name.length > 0);
    const skipped = vendorRows.length - valid.length;

    if (valid.length === 0) {
      return NextResponse.json(
        { error: "No valid vendors found — ensure the CSV has a 'name' column with at least one value" },
        { status: 400 },
      );
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
      skipped,
      vendors:  data,
      // Surface non-fatal parse warnings so the UI can show them
      warnings: errors.length > 0
        ? errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.message}`)
        : undefined,
    });
  } catch (err: any) {
    console.error("[vendors/import] Unexpected error:", err);
    return NextResponse.json({ error: err?.message ?? "Import failed" }, { status: 500 });
  }
}
