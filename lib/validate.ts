import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

// parseJson returns either { data } or { error: NextResponse(400) }.
// Keeps route handlers terse: one parse call, one early return.
export async function parseJson<T>(
  req: Request,
  schema: ZodType<T>
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      error: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return { error: badRequest(result.error) };
  }
  return { data: result.data };
}

export function parseParams<T>(
  input: unknown,
  schema: ZodType<T>
): { data: T; error?: never } | { data?: never; error: NextResponse } {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { error: badRequest(result.error) };
  }
  return { data: result.data };
}

function badRequest(err: ZodError): NextResponse {
  const issues = err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
  return NextResponse.json({ error: "Invalid request.", issues }, { status: 400 });
}
