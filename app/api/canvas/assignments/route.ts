import { NextResponse } from "next/server";
import { canvasClient } from "@/lib/canvas"; 
import { readParams } from "@/lib/query";    

export async function GET(req: Request) {
  // TODO: call canvasClient.getAssignments(courseId, token)
  return NextResponse.json({ status: "assignments placeholder" });
}