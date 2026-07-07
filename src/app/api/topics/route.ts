import { NextRequest, NextResponse } from "next/server";
import { saveTopicConfidence } from "@/lib/topics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as {
    topicId?: string;
    confidence?: number;
  };

  if (!payload.topicId) {
    return NextResponse.json({ error: "topicId is required" }, { status: 400 });
  }

  const confidence = await saveTopicConfidence(payload.topicId, payload.confidence ?? 3);

  return NextResponse.json({ topicId: payload.topicId, confidence });
}
