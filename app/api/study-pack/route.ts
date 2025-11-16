import { NextRequest } from 'next/server';
import { createCanvasClient } from "@/lib/canvas";
import { runWithTools } from "@/lib/ai";



/**
 * Safely formats arrays or single objects into newline-separated lists.
 */
function toList<T>(
  arrOrOne: T[] | T | null | undefined,
  pick: (x: T) => string
): string {
  if (Array.isArray(arrOrOne)) return arrOrOne.map(pick).join("\n");
  if (arrOrOne) return pick(arrOrOne);
  return "None";
}

/**
 * Generates a Claude-powered study guide ("study pack") for a given Canvas course.
 *
 * Expected JSON body:
 * {
 *   "courseId": "187560",
 *   "token": "your_canvas_pat"
 * }
 *
 * Returns:
 * {
 *   "summary": "...Claude-generated guide...",
 *   "context": { modules, assignments, pages, quizzes }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { courseId, token } = await request.json();

    if (!courseId || !token) {
      return Response.json(
        { error: "Missing required fields: courseId and token." },
        { status: 400 }
      );
    }

    const client = createCanvasClient(token);

    // Pull a lightweight but useful snapshot
    const [modules, assignments, pages, quizzes] = await Promise.all([
      client.getModules(courseId),
      client.getAssignments(courseId),
      client.getPages(courseId),
      client.getQuizzes(courseId),
    ]);

    const prompt =
      `You are an academic study assistant. Create a concise, structured study guide from this Canvas course snapshot.

      Course ID: ${courseId}

      ### Modules
      ${toList(modules, (m) => `- ${m.name ?? "Untitled Module"}`)}

      ### Assignments
      ${toList(assignments, (a) => `- ${a.name ?? "Unnamed Assignment"}`)}

      ### Pages
      ${toList(pages, (p) => `- ${p.title ?? p.url ?? "Untitled Page"}`)}

      ### Quizzes
      ${toList(quizzes, (q) => `- ${q.title ?? "Untitled Quiz"}`)}

      Output format:
      - A short title
      - Key topics (bullets)
      - What to review (bullets)
      - Upcoming deadlines/assessments if visible (bullets)
      - 3–5 suggested practice prompts
      Keep it under ~400 words, plain text.
      `.trim();

    // reuse bedrock wrapper
    const result = await runWithTools(prompt);

    return Response.json ({
      success: true,
      summary: result.text || "Claude did not return a summary,",
    });
  } catch (error) {
    console.error('study-pack error:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Failed to process study pack' 
    }, { status: 500 });
  }
}

