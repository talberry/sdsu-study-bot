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
      ? authHeader.slice(7) 
      : null;

    // Set up Server-Sent Events streaming
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendSSE = (data: object) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          await runWithTools(
            message,
            canvasToken,
            (update) => {
              // Send tool update via SSE
              sendSSE({
                type: 'tool',
                step: update.step,
                name: update.name,
                status: update.status,
                input: update.input,
                output: update.output
              });
            }
          ).then((result) => {
            // Send final response
            sendSSE({
              type: 'final',
              text: result.text,
              message: result.message
            });
            controller.close();
          }).catch((error) => {
            // Send error response
            sendSSE({
              type: 'error',
              error: error instanceof Error ? error.message : 'Failed to process chat'
            });
            controller.close();
          });
        } catch (error) {
          sendSSE({
            type: 'error',
            error: error instanceof Error ? error.message : 'Failed to process chat'
          });
          controller.close();
        }
      }
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