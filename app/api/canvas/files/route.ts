import { NextResponse } from "next/server";
import { createCanvasClient, readParams } from "@/lib/canvas"; 
import type { ModuleItem } from "@/types/canvas";    

/**
 * handles GET requests for Canvas files
 * 
 * @param {Request} req - The incoming HTTP request object
 *  Expected query parameters:
 *    - courseId: The Canvas course ID (required)
 *    - token: The Canvas API token (required)
 *    - moduleId: The Canvas module ID (optional, for listing)
 *    - fileId: The Canvas file ID (optional)
 *    - moduleItemId: The Canvas module item ID (optional, for context)
 * @returns {Promise<NextResponse>} JSON response containing:
 *   - { file } for a single file
 *   - { files } for multiple files
 *   - { error } with an HTTP error code if something fails
 */
export async function GET(req: Request) {
  try {
    const { courseId, moduleId, fileId, moduleItemId, token } = readParams(req);  
    
    // required params validation - fileId can work without courseId, but we need at least one
    if(!token) {
      return NextResponse.json(
        { error: "Missing required parameter: Canvas personal access token is necessary." },
        { status: 400 }
      );
    }

    if(!courseId && !fileId) {
      return NextResponse.json(
        { error: "Missing required parameter: either courseId or fileId must be provided." },
        { status: 400 }
      );
    }

    // Create client instance with token
    const client = createCanvasClient(token);

    // Fetch a specific file 
    if(fileId) {
      const file = await client.getFiles(undefined, fileId);
      
      if(!file) {
        return NextResponse.json(
          { error: `File with ID ${fileId} not found.` },
          { status: 404 }
        );
      }

      // Attach module context if provided
      if (moduleItemId && typeof file === 'object' && !Array.isArray(file)) {
        file.moduleItemId = moduleItemId;
      }

      return NextResponse.json({ file });
    }

    // Fetch all files in a specific module
    if (moduleId && courseId) {
      const moduleItems = await client.getModuleItems(courseId, moduleId);
      
      // Ensure moduleItems is an array
      const itemsArray = Array.isArray(moduleItems) ? moduleItems : [moduleItems];
      
      const files = itemsArray.filter(
        (item: ModuleItem) => item.type === "File"
      );

      if (!files.length) {
        return NextResponse.json(
          { message: `No files found in module ${moduleId}.` },
          { status: 200 }
        );
      }

      return NextResponse.json({ files });
    }

    // otherwise fetch all course files
    if (courseId) {
      const files = await client.getFiles(courseId);
      
      // Ensure files is an array
      const filesArray = Array.isArray(files) ? files : [files];

      if(!filesArray || filesArray.length === 0) {
        return NextResponse.json(
          { message: "No files found for this course." },
          { status: 200 }
        );
      }
      
      return NextResponse.json({ files: filesArray });
    }

    return NextResponse.json(
      { error: "Invalid parameters." },
      { status: 400 }
    );
  } catch(error: unknown) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files.", details: error instanceof Error ? error.message : "Unknown error."},
      { status: 500 }
    );
  }
}