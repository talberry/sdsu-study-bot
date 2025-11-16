import { NextResponse } from "next/server";
import { createCanvasClient, readParams } from "@/lib/canvas"; 

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

    // Fetch a specific page 
    if(pageId) {
      const page = await createCanvasClient.getPages(courseId, pageId);
      
        if(!page) {
          return NextResponse.json(
          { error: "Page with ID ${pageId} not found." },
          { status: 404 }
        );
      }

      // Attach module context if provided
      if (moduleItemId) {
        page.moduleItemId = moduleItemId;
      }

      return NextResponse.json({ page });
    }

    // Fetch all pages in a specific module
    if (moduleId) {
      const moduleItems = await createCanvasClient.getModuleItems(courseId, moduleId);

      const pages = moduleItems.filter(
        (Item: any) => Item.type === "Page"
      );

      if (!pages.length) {
        return NextResponse.json(
          { message: "No pages found in module ${moduleId}." },
          { status: 200 }
        );
      }

      return NextResponse.json({ pages });
    }

    // otherwise fetch all course pages
    const pages = await createCanvasClient.getPages(courseId);

    if(!pages || pages.length === 0) {
      return NextResponse.json(
        { message: "No pages found for this course." },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ pages });
  } catch(error: any) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages.", details: error.message ?? "Unknown error."},
      { status: 500 }
    );
  }
  
  
}