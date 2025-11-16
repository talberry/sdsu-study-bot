import { NextResponse } from "next/server";
import { createCanvasClient } from "@/lib/canvas"; 
import { readParams } from "@/lib/canvas";
import type { ModuleItem } from "@/types/canvas";    

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

    // Create client instance with token
    const client = createCanvasClient(token);

    // Fetch a specific assignment 
    if(assignmentId) {
      const assignment = await client.getAssignments(courseId, assignmentId);
      
      if(!assignment) {
        return NextResponse.json(
          { error: `Assignment with ID ${assignmentId} not found.` },
          { status: 404 }
        );
      }

      // Attach module context if provided
      if (moduleItemId && typeof assignment === 'object' && !Array.isArray(assignment)) {
        assignment.moduleItemId = moduleItemId;
      }

      return NextResponse.json({ assignment });
    }

    // Fetch all assignments in a specific module
    if (moduleId) {
      const moduleItems = await client.getModuleItems(courseId, moduleId);
      
      // Ensure moduleItems is an array
      const itemsArray = Array.isArray(moduleItems) ? moduleItems : [moduleItems];
      
      const assignments = itemsArray.filter(
        (item: ModuleItem) => item.type === "Assignment"
      );

      if (!assignments.length) {
        return NextResponse.json(
          { message: `No assignments found in module ${moduleId}.` },
          { status: 200 }
        );
      }

      return NextResponse.json({ assignments });
    }

    // otherwise fetch all course assignments
    const assignments = await client.getAssignments(courseId);
    
    // Ensure assignments is an array
    const assignmentsArray = Array.isArray(assignments) ? assignments : [assignments];

    if(!assignmentsArray || assignmentsArray.length === 0) {
      return NextResponse.json(
        { message: "No assignments found for this course." },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ assignments: assignmentsArray });
  } catch(error: unknown) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments.", details: error instanceof Error ? error.message : "Unknown error."},
      { status: 500 }
    );
  }
}