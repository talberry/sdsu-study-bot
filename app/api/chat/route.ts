import { NextRequest } from 'next/server';
import { runWithTools } from '@/lib/ai';
import { readParams } from "@/lib/canvas";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    const { token, courseId } = readParams(request);

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Simple intent: if user asks for a study guide → call the study-pack route
    const lower = message.toLowerCase();
    const wantsStudyGuide =
      lower.includes("study guide") ||
      lower.includes("study pack") ||
      lower.includes("make notes") ||
      lower.includes("study notes");

    if (wantsStudyGuide) {
      if (!token || !courseId) {
        return Response.json(
          { error: "To make a study guide, include courseId and token in the request body." },
          { status: 400 }
        );
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/canvas/study-pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, token }),
      });

      const data = await res.json();
      if (!res.ok) {
        return Response.json({ error: data?.error ?? "Study-pack failed" }, { status: res.status });
      }

      return Response.json({
        text: data.summary,
        message: "Generated a study guide from your Canvas data.",
      });
    }

    // Otherwise, normal Claude chat
    const result = await runWithTools(message);
    
    return Response.json({ 
      text: result.text,
      message: result.message 
    });

  } catch (error) {
    console.error('Chat error:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Failed to process chat' 
    }, { status: 500 });
  }
}