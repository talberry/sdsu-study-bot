import { NextResponse } from "next/server";
import { canvasClient } from "@/lib/canvas"; 
import { readParams } from "@/lib/query";    

/**
 * handles GET requests for Canvas files
 * 
 * @param {Request} req - The incoming HTTP request object
 *  Expecte query parameters:
 *    - courseId: The Canvas course ID (required)
 *    - token: The Canvas API token (required)
 *    - moduleId: The Canvas module ID (optional, for listing)
 *    - fileId: The Canvas file ID (optional)
 *    - moduleItemId: The Canvsas module item ID (optional, for context)
 * @returns {Promise<NextResponse>} JSON response containing:
 *   - { file } for a single file
 *   - { files } for multiple files
 *   - { error } with an HTTP error code is something fails
 */
export async function GET(req: Request) {
  try {
    const { courseId, moduleId, fileId, moduleItemId, token } = readParams(req);  
    
    // required params validation
    if(!courseId || !token) {
      return NextResponse.json(
        { error: "Missing required parameters; both course ID and Canvas personal access token are necessary." },
        { status: 400 }
      );
    }

    // Fetch a specific file 
    if(fileId) {
      const file = await canvasClient.getfiles(courseId, fileId, token);
      
        if(!file) {
          return NextResponse.json(
          { error: "file with ID ${fileId} not found." },
          { status: 404 }
        );
      }

      // Attach module context if provided
      if (moduleItemId) {
        file.moduleItemId = moduleItemId;
      }

      return NextResponse.json({ file });
    }

    // Fetch all files in a specific module
    if (moduleId) {
      const moduleItems = await canvasClient.getModuleItems(courseId, moduleId, token);

      const files = moduleItems.filter(
        (Item: any) => Item.type === "File"
      );

      if (!files.length) {
        return NextResponse.json(
          { message: "No files found in module ${moduleId}." },
          { status: 200 }
        );
      }

      return NextResponse.json({ files });
    }

    // otherwise fetch all course files
    const files = await canvasClient.getfiles(courseId, token);

    if(!files || files.length === 0) {
      return NextResponse.json(
        { message: "No files found for this course." },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ files });
  } catch(error: any) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files.", details: error.message ?? "Unknown error."},
      { status: 500 }
    );
  }
  
  
}