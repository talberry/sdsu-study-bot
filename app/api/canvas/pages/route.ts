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
 *    - pageId: The Canvas page ID (optional)
 *    - moduleItemId: The Canvas module item ID (optional, for context)
 * @returns {Promise<NextResponse>} JSON response containing:
 *   - { page } for a single page
 *   - { pages } for multiple pages
 *   - { error } with an HTTP error code if something fails
 */
export async function GET(req: Request) {
  try {
    const { courseId, moduleId, pageId, moduleItemId, token } = readParams(req);  
    
    // required params validation
    if(!courseId || !token) {
      return NextResponse.json(
        { error: "Missing required parameters; both course ID and Canvas personal access token are necessary." },
        { status: 400 }
      );
    }

    // Create client instance with token
    const client = createCanvasClient(token);

    // Fetch a specific page 
    if(pageId) {
      const page = await client.getPages(courseId, pageId);
      
      if(!page) {
        return NextResponse.json(
          { error: `Page with ID ${pageId} not found.` },
          { status: 404 }
        );
      }

      // Attach module context if provided
      if (moduleItemId && typeof page === 'object' && !Array.isArray(page)) {
        page.moduleItemId = moduleItemId;
      }

      return NextResponse.json({ page });
    }

    // Fetch all pages in a specific module
    if (moduleId) {
      const moduleItems = await client.getModuleItems(courseId, moduleId);
      
      // Ensure moduleItems is an array
      const itemsArray = Array.isArray(moduleItems) ? moduleItems : [moduleItems];
      
      const pages = itemsArray.filter(
        (item: ModuleItem) => item.type === "Page"
      );

      if (!pages.length) {
        return NextResponse.json(
          { message: `No pages found in module ${moduleId}.` },
          { status: 200 }
        );
      }

      return NextResponse.json({ pages });
    }

    // otherwise fetch all course pages
    const pages = await client.getPages(courseId);

    // Ensure pages is an array
    const pagesArray = Array.isArray(pages) ? pages : [pages];
    
    if(!pagesArray || pagesArray.length === 0) {
      return NextResponse.json(
        { message: "No pages found for this course." },
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