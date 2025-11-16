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
      const course = await client.getCourses(courseId);

      if (!course) {
        return NextResponse.json(
          { error: `Course with ID ${courseId} not found.`},
          { status: 404 }
        );
      }
      return NextResponse.json({ course });
    }

    // Otherwise fetch all courses
    const courses = await client.getCourses();

    // Ensure courses is in array
    const coursesArray = Array.isArray(courses) ? courses : [courses];

    if (!coursesArray || coursesArray.length === 0) {
      return NextResponse.json(
        { message: "No courses found for the current user." },
        { status: 200 }
      );
    }
    return NextResponse.json({ courses: coursesArray });
  } catch (error: unknown) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses.", details: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 }
    );
  }
}

