import { NextRequest } from 'next/server';
import { runWithTools } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await runWithTools(message);
    
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