import { NextResponse } from "next/server";
import { createCanvasClient, readParams } from "@/lib/canvas";
import type { ModuleItem } from "@/types/canvas";

/**
 * handles GET requests for Canvas pages
 * 
 * @param {Request} req - The incoming HTTP request object
 *  Expected query parameters:
 *    - courseId: The Canvas course ID (required)
 *    - token: The Canvas API token (required)
 *    - moduleId: The Canvas module ID (optional, for listing)
 *    - page_slug: The Canvas page slug (optional)
 * @returns {Promise<NextResponse>} JSON response containing:
 *   - { page } for a single page
 *   - { error } with an HTTP error code if something fails
 */
export async function GET(req: Request) {
  try {
    const { courseId, moduleId, page_slug, token } = readParams(req);  
    
    // required params validation
    if(!courseId || !token) {
      return NextResponse.json(
        { error: "Missing required parameters; both course ID and Canvas personal access token are necessary." },
        { status: 400 }
      );
    }

    // Create client instance with token
    const client = createCanvasClient(token);
    let targetSlug = page_slug;

    // Resolve from moduleId
    if (moduleId && !targetSlug) {
      const items = await client.getModuleItems(courseId, moduleId);

      const itemsArray = Array.isArray(items) ? items : [items];
      const pageItem = itemsArray.find((item: ModuleItem) => item.type === "Page");

      
      if (!pageItem || !pageItem.page_url) {
        return NextResponse.json(
          { error: `No page found in module ${moduleId}.` },
          { status: 404 }
        );
      }

      targetSlug = pageItem.page_url;
    }

    if (!targetSlug) {
      return NextResponse.json(
        { error: "Missing required paramter: page_slug / moduleId" },
        { status: 400 }
      );
    }

    const page = await client.getPages(courseId, targetSlug);

    if (!page) {
      return NextResponse.json(
        { error: `Page '${targetSlug}' not found for course ${courseId}.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ page });


  } catch(error: unknown) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages.", details: error instanceof Error ? error.message : "Unknown error."},
      { status: 500 }
    );
  }
  
  
}