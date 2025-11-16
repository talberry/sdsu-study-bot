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
 *    - moduleItemId: The Canvas module item ID (optional)
 *    - page_slug: The Canvas page slug (optional)
 * @returns {Promise<NextResponse>} JSON response containing:
 *   - { page } for a single page
 *   - { error } with an HTTP error code if something fails
 */
export async function GET(req: Request) {
  try {
    const { courseId, moduleId, moduleItemId, page_slug, token } = readParams(req);  
    
    // required params validation
    if(!courseId || !token) {
      return NextResponse.json(
        { error: "Missing required parameters; both course ID and Canvas personal access token are necessary." },
        { status: 400 }
      );
    }

    // Create client instance with token
    const client = createCanvasClient(token);
    if (page_slug) {
      const page = await client.getPages(courseId, page_slug);
      return NextResponse.json({ page });
    }

    // Resolve from moduleId
    if (moduleId) {
      const items = await client.getModuleItems(courseId, moduleId);

      const itemsArray = Array.isArray(items) ? items : [items];
      const pageItems = itemsArray
        .filter((item: ModuleItem) => item.type === "Page");

      if (!pageItems || pageItems.length === 0) {
        return NextResponse.json(
          { error: `No page found in module ${moduleId}.` },
          { status: 404 }
        );
      }

      if (moduleItemId) {
        const item = pageItems.find(
          (item: ModuleItem) => String (item.id) === String (moduleItemId)
        );
        if (!item || !item.page_url) {
          return NextResponse.json(
            { error: `Module item ${moduleItemId} is not a page or could not be found in module ${moduleId}.` },
            { status: 404 }
          );
        }
        const page = await client.getPages(courseId, item.page_url);
        return NextResponse.json({ page });
      }

      return NextResponse.json({ pages: pageItems });
    }

    // get all pages if accessible
    const pages = await client.getPages(courseId);

    const pagesArray = Array.isArray(pages) ? pages : [pages];
    if (!pagesArray || pagesArray.length === 0) {
      return NextResponse.json(
        { message: "No pages found for this course or Pages are disabled." },
        { status: 200 }
      );
    }

    return NextResponse.json({ pages: pagesArray });
  } catch(error: unknown) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages.", details: error instanceof Error ? error.message : "Unknown error."},
      { status: 500 }
    );
  }
  
  
}