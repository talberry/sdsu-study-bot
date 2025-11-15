import { NextResponse } from "next/server";
import { canvasClient } from "@/lib/canvas"; 
import { readParams } from "@/lib/query";    

/**
 * handles GET requests for Canvas quizzes
 * 
 * @param {Request} req - The incoming HTTP request object
 *  Expecte query parameters:
 *    - courseId: The Canvas course ID (required)
 *    - token: The Canvas API token (required)
 *    - moduleId: The Canvas module ID (optional, for listing)
 *    - quizId: The Canvas quiz ID (optional)
 *    - moduleItemId: The Canvsas module item ID (optional, for context)
 * @returns {Promise<NextResponse>} JSON response containing:
 *   - { quiz } for a single quiz
 *   - { quizzes } for multiple quizzes
 *   - { error } with an HTTP error code is something fails
 */
export async function GET(req: Request) {
  try {
    const { courseId, moduleId, quizId, moduleItemId, token } = readParams(req);  
    
    // required params validation
    if(!courseId || !token) {
      return NextResponse.json(
        { error: "Missing required parameters; both course ID and Canvas personal access token are necessary." },
        { status: 400 }
      );
    }

    // Fetch a specific quiz 
    if(quizId) {
      const quiz = await canvasClient.getquizzes(courseId, quizId, token);
      
        if(!quiz) {
          return NextResponse.json(
          { error: "quiz with ID ${quizId} not found." },
          { status: 404 }
        );
      }

      // Attach module context if provided
      if (moduleItemId) {
        quiz.moduleItemId = moduleItemId;
      }

      return NextResponse.json({ quiz });
    }

    // Fetch all quizzes in a specific module
    if (moduleId) {
      const moduleItems = await canvasClient.getModuleItems(courseId, moduleId, token);

      const quizzes = moduleItems.filter(
        (Item: any) => Item.type === "Quiz"
      );

      if (!quizzes.length) {
        return NextResponse.json(
          { message: "No quizzes found in module ${moduleId}." },
          { status: 200 }
        );
      }

      return NextResponse.json({ quizzes });
    }

    // otherwise fetch all course quizzes
    const quizzes = await canvasClient.getquizzes(courseId, token);

    if(!quizzes || quizzes.length === 0) {
      return NextResponse.json(
        { message: "No quizzes found for this course." },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ quizzes });
  } catch(error: any) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes.", details: error.message ?? "Unknown error."},
      { status: 500 }
    );
  }
  
  
}