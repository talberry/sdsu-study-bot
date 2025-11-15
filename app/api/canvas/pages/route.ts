import { NextResponse } from "next/server";
import { canvasClient } from "@/lib/canvas"; 
import { readParams } from "@/lib/query";    

/**
 * handles GET requests for Canvas pages
 * 
 * @param {Request} req - The incoming HTTP request object
 *  Expecte query parameters:
 *    - courseId: The Canvas course ID (required)
 *    - token: The Canvas API token (required)
 *    - moduleId: The Canvas module ID (optional, for listing)
 *    - pageId: The Canvas page ID (optional)
 *    - moduleItemId: The Canvsas module item ID (optional, for context)
 * @returns {Promise<NextResponse>} JSON response containing:
 *   - { page } for a single page
 *   - { pages } for multiple pages
 *   - { error } with an HTTP error code is something fails
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
      const page = await canvasClient.getpages(courseId, pageId, token);
      
        if(!page) {
          return NextResponse.json(
          { error: "page with ID ${pageId} not found." },
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
      const moduleItems = await canvasClient.getModuleItems(courseId, moduleId, token);

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
    const pages = await canvasClient.getpages(courseId, token);

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