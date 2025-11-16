import { NextResponse } from "next/server";
import { createCanvasClient, readParams } from "@/lib/canvas";

/**
 * handles GET requests for Canvas assignments
 * 
 * @param {Request} req - The incoming HTTP request object
 *  Expected query parameters:
 *    - courseId: The Canvas course ID (required)
 *    - token: The Canvas API token (required)
 *    - moduleId: The Canvas module ID (optional, for listing)
 *    - assignmentId: The Canvas assignment ID (optional)
 *    - moduleItemId: The Canvas module item ID (optional, for context)
 * @returns {Promise<NextResponse>} JSON response containing:
 *   - { assignment } for a single assignment
 *   - { assignments } for multiple assignments
 *   - { error } with an HTTP error code if something fails
 */
export async function GET(req: Request) {
  try {
    const { courseId, moduleId, assignmentId, moduleItemId, token } = readParams(req);  
    
    // required params validation
    if(!courseId || !token) {
      return NextResponse.json(
        { error: "Missing required parameters; both course ID and Canvas personal access token are necessary." },
        { status: 400 }
      );
    }

    // Fetch a specific assignment 
    if(assignmentId) {
      const assignment = await canvasClient.getAssignments(courseId, assignmentId, token);
      
        if(!assignment) {
          return NextResponse.json(
          { error: "Assignment with ID ${assignmentId} not found." },
          { status: 404 }
        );
      }

      // Attach module context if provided
      if (moduleItemId) {
        assignment.moduleItemId = moduleItemId;
      }

      return NextResponse.json({ assignment });
    }

    // Fetch all assignments in a specific module
    if (moduleId) {
      const moduleItems = await canvasClient.getModuleItems(courseId, moduleId, token);

      const assignments = moduleItems.filter(
        (Item: any) => Item.type === "Assignment"
      );

      if (!assignments.length) {
        return NextResponse.json(
          { message: "No assignments found in module ${moduleId}." },
          { status: 200 }
        );
      }

      return NextResponse.json({ assignments });
    }

    // otherwise fetch all course assignments
    const assignments = await canvasClient.getAssignments(courseId, token);

    if(!assignments || assignments.length === 0) {
      return NextResponse.json(
        { message: "No assignments found for this course." },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ assignments });
  } catch(error: any) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments.", details: error.message ?? "Unknown error."},
      { status: 500 }
    );
  }
  
  
}