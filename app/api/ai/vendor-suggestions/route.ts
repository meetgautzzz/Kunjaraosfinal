import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function POST() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  return NextResponse.json({ suggestions: [] });
}
