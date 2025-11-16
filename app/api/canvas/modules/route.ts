import { NextResponse } from 'next/server';
import { createCanvasClient, readParams } from "@/lib/canvas";

/**
 * Handles GET requests for Canvas courses
 * 
 * @param {Request} req
 *    - courseId: The Canvas course ID (required)
 *    - token: The Canvas API token (required)
 *    - moduleId: The Canvas module ID (optional)
 * @returns {Promise<NextResponse>} JSON response
 *    - { module } for a single module
 *    - { modules } for a multiple modules
 *    - { error } with an HTTP error code if something goes wrong
 */
export async function GET(req: Request) {
  try {
    const { courseId, moduleId, token } = readParams(req);

    // Required paramter validation
    if(!token || !courseId) {
      return NextResponse.json(
        { error: "Missing required parameters Canvas API token or Canvas course ID." },
        { status: 400 }
      );
    }

    const client = createCanvasClient(token);

    // Fetch a single module if moduleId provided.
    if (moduleId) {
      const module = await createCanvasClient.getModule(courseId, moduleId);

      if (!module) {
        return NextResponse.json(
          { error: `Module with ID ${moduleId} not found.`},
          { status: 404 }
        );
      }
      return NextResponse.json({ module });
    }

    // Otherwise fetch all modules
    const modules = await createCanvasClient.getModules(courseId);

    if (!modules || modules.length === 0) {
      return NextResponse.json(
        { message: "No modules found for the current user." },
        { status: 200 }
      );
    }
    return NextResponse.json({ modules });
  } catch (error: any) {
    console.error("Error fetching modules:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules.", details: error.message ?? "Unknown error." },
      { status: 500 }
    );
  }
}

