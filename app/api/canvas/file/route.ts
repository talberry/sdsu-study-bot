import { NextResponse } from "next/server";
import { canvasClient } from "@/lib/canvas"; 
import { readParams } from "@/lib/query";    

export async function GET(req: Request) {
  // TODO: call canvasClient.getFile(courseId, fileId, token)
  return NextResponse.json({ status: "file placeholder" });
}