import { NextRequest } from "next/server";
import { jsonError, jsonResponse } from "@/lib/api-response";
import { saveTopicConfidence } from "@/lib/topics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      topicId?: string;
      confidence?: number;
    };

    if (!payload.topicId) {
      return jsonResponse({ error: "topicId is required" }, { status: 400 });
    }

    const confidence = await saveTopicConfidence(payload.topicId, payload.confidence ?? 3);

    return jsonResponse({ topicId: payload.topicId, confidence });
  } catch (error) {
    console.error("[topics] POST error", error);
    return jsonError(error, "Failed to update topic confidence.", { status: 500 });
  }
}
