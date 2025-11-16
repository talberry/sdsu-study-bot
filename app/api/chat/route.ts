import { NextRequest } from 'next/server';
import { runWithTools } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await runWithTools(message, (toolUpdate) => {
            // Send tool execution updates in real-time
            const data = `data: ${JSON.stringify({ type: 'tool', ...toolUpdate })}\n\n`;
            controller.enqueue(encoder.encode(data));
          });
          
          // Send final result
          const finalData = `data: ${JSON.stringify({ 
            type: 'final', 
            text: result.text,
            toolTrace: result.toolTrace 
          })}\n\n`;
          controller.enqueue(encoder.encode(finalData));
          controller.close();
        } catch (error) {
          const errorData = `data: ${JSON.stringify({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Failed to process chat' 
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Failed to process chat' 
    }, { status: 500 });
  }
}