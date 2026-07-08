import { jsonResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return jsonResponse({
    ok: true,
    time: new Date().toISOString(),
    app: "CodeFire",
  });
}
