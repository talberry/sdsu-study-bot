import { NextResponse } from 'next/server';
import { createCanvasClient, readParams } from "@/lib/canvas";

/**
 * Handles GET requests for Canvas courses
 * 
 * @param {Request} req
 *    - courseId: The Canvas course ID (optional)
 *    - token: The Canvas API token (required)
 * @returns {Promise<NextResponse>} JSON response
 *    - { course } for a single course
 *    - { courses } for a multiple courses
 *    - { error } with an HTTP error code if something goes wrong
 */
export async function GET(req: Request) {
  try {
    const { courseId, token } = readParams(req);

    // Required paramter validation
    if(!token) {
      return NextResponse.json(
        { error: "Missing required parameter: Canvas API token" },
        { status: 400 }
      );
    }

    const client = createCanvasClient(token);

    // Fetch a single course if courseId provided.
    if (courseId) {
      const course = await createCanvasClient.getCourse(courseId);

      if (!course) {
        return NextResponse.json(
          { error: "Course with ID ${courseId} not found."},
          { status: 404 }
        );
      }
      return NextResponse.json({ course });
    }

    // Otherwise fetch all courses
    const courses = await createCanvasClient.getCourses();

    if (!courses || courses.length === 0) {
      return NextResponse.json(
        { message: "No courses found for the current user." },
        { status: 200 }
      );
    }
    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses.", details: error.message ?? "Unknown error." },
      { status: 500 }
    );
  }
}

