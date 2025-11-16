import { NextRequest } from 'next/server';
import { runWithTools } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Extract Canvas token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const canvasToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    // Log token presence for debugging
    if (canvasToken) {
      console.log('Canvas token provided for chat request');
    } else {
      console.log('No Canvas token provided - Canvas tools will not be available');
    }

    const result = await runWithTools(message, canvasToken);
    
    return Response.json({ 
      text: result.text,
      message: result.message 
    });

  } catch (error) {
    console.error('Chat error:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Failed to process chat' 
    }, { status: 500 });
  }
}