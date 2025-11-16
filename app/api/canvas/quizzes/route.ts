import { NextResponse } from "next/server";
import { createCanvasClient, readParams } from "@/lib/canvas"; 
import type { ModuleItem } from "@/types/canvas";    

/**
 * handles GET requests for Canvas quizzes
 * 
 * @param {Request} req - The incoming HTTP request object
 *  Expected query parameters:
 *    - courseId: The Canvas course ID (required)
 *    - token: The Canvas API token (required)
 *    - moduleId: The Canvas module ID (optional, for listing)
 *    - quizId: The Canvas quiz ID (optional)
 *    - moduleItemId: The Canvas module item ID (optional, for context)
 * @returns {Promise<NextResponse>} JSON response containing:
 *   - { quiz } for a single quiz
 *   - { quizzes } for multiple quizzes
 *   - { error } with an HTTP error code if something fails
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

    // Create client instance with token
    const client = createCanvasClient(token);

    // Fetch a specific quiz 
    if(quizId) {
      const quiz = await client.getQuizzes(courseId, quizId);
      
      if(!quiz) {
        return NextResponse.json(
          { error: `Quiz with ID ${quizId} not found.` },
          { status: 404 }
        );
      }

      // Attach module context if provided
      if (moduleItemId && typeof quiz === 'object' && !Array.isArray(quiz)) {
        quiz.moduleItemId = moduleItemId;
      }

      return NextResponse.json({ quiz });
    }

    // Fetch all quizzes in a specific module
    if (moduleId) {
      const moduleItems = await client.getModuleItems(courseId, moduleId);
      
      // Ensure moduleItems is an array
      const itemsArray = Array.isArray(moduleItems) ? moduleItems : [moduleItems];
      
      const quizzes = itemsArray.filter(
        (item: ModuleItem) => item.type === "Quiz"
      );

      if (!quizzes.length) {
        return NextResponse.json(
          { message: `No quizzes found in module ${moduleId}.` },
          { status: 200 }
        );
      }

      return NextResponse.json({ quizzes });
    }

    // otherwise fetch all course quizzes
    const quizzes = await client.getQuizzes(courseId);

    // Ensure quizzes is an array
    const quizzesArray = Array.isArray(quizzes) ? quizzes : [quizzes];
    
    if(!quizzesArray || quizzesArray.length === 0) {
      return NextResponse.json(
        { message: "No quizzes found for this course." },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ quizzes: quizzesArray });
  } catch(error: unknown) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes.", details: error instanceof Error ? error.message : "Unknown error."},
      { status: 500 }
    );
  }
  
  
}