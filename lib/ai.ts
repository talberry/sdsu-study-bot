import { BedrockRuntimeClient, ConverseCommand, ConverseCommandInput, Message } from "@aws-sdk/client-bedrock-runtime";
import { toolSchemas } from "./functions";
import { Tool } from "@aws-sdk/client-bedrock-runtime";
import { ContentBlock } from "@aws-sdk/client-bedrock-runtime";
import { createCanvasClient } from "./canvas";
import type { Assignment, Page } from "@/types/canvas";
import { SYSTEM_PROMPT } from './system_prompt';


const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

async function callConverse(messages: Message[], systemPrompt = SYSTEM_PROMPT) {
    const input: ConverseCommandInput = {
        modelId: process.env.BEDROCK_MODEL_ID,
        messages,
        system: [{text: systemPrompt}],
        toolConfig: {
            tools: toolSchemas.map(schema => ({ toolSpec: schema })) as Tool[]
        }
    };

    const command = new ConverseCommand(input);
    const response = await client.send(command);
    return response;
}

type ToolCall = {
    toolUseId: string,
    name: string,
    input: Record<string, unknown>
}

type ToolTraceEntry = {
    step: number,
    name: string,
    input: Record<string, unknown>
    output: Record<string, unknown>
}

function extractToolCallsFromMessage(message: Message): ToolCall[] {
    const toolCalls: ToolCall[] = [];

    for (const block of message.content ?? []) {
        if ("toolUse" in block && block.toolUse) {
            const toolUse = block.toolUse;
            if (toolUse.toolUseId && toolUse.name && toolUse.input) {
                toolCalls.push({
                    toolUseId: toolUse.toolUseId,
                    name: toolUse.name,
                    input: toolUse.input as Record<string, unknown>
                });
            }
        }
    }
    return toolCalls;
}

// Canvas-specific tools that require authentication
const CANVAS_TOOLS = ["get_courses", "get_modules", "get_page_content", "get_assignment_content"];

async function executeTool(call: ToolCall, canvasToken: string | null): Promise<Record<string, unknown>> {
    const {name, input} = call;

    // Check if this is a Canvas tool that requires authentication
    if (CANVAS_TOOLS.includes(name)) {
        if (!canvasToken) {
            throw new Error("Canvas API token is required to use Canvas tools. Please link your Canvas account first.");
        }
    }

    switch(name) {
        default:
        throw new Error(`Unknown tool ${name}`);

        case "get_courses": {
            if (!canvasToken) {
                throw new Error("Canvas API token is required");
            }
            const canvasClient = createCanvasClient(canvasToken);
            try {
                const courses = await canvasClient.getCourses();
                const coursesArray = Array.isArray(courses) ? courses : [courses];
                return {courses: coursesArray};
            } catch (error) {
                console.error("Error fetching courses:", error);
                throw new Error(`Failed to fetch courses: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        }

        case "get_modules": {
            if (!canvasToken) {
                throw new Error("Canvas API token is required");
            }
            const canvasClient = createCanvasClient(canvasToken);
            const {course_id} = input;
            if (!course_id || typeof course_id !== "number") {
                throw new Error("course_id is required and must be a number");
            }
            try {
                const modules = await canvasClient.getModules(course_id.toString());
                const modulesArray = Array.isArray(modules) ? modules : [modules];
                return {modules: modulesArray, course_id};
            } catch (error) {
                console.error("Error fetching modules:", error);
                throw new Error(`Failed to fetch modules: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        }

        case "get_page_content": {
            if (!canvasToken) {
                throw new Error("Canvas API token is required");
            }
            const canvasClient = createCanvasClient(canvasToken);
            const {course_id, page_id} = input;
            if (!course_id || typeof course_id !== "number") {
                throw new Error("course_id is required and must be a number");
            }
            if (!page_id) {
                throw new Error("page_id is required");
            }
            try {
                // Canvas API uses page URL as identifier, but we'll try to handle both numeric ID and URL
                // If it's a number, we'll need to fetch all pages and find the matching one
                // Otherwise, treat it as a URL string
                let page: Page;
                if (typeof page_id === "number") {
                    // Fetch all pages and find the one with matching page_id
                    const pages = await canvasClient.getPages(course_id.toString());
                    const pagesArray = Array.isArray(pages) ? pages : [pages];
                    const foundPage = pagesArray.find((p: Page) => p.page_id === page_id);
                    if (!foundPage) {
                        throw new Error(`Page with ID ${page_id} not found in course ${course_id}`);
                    }
                    page = foundPage;
                } else {
                    // Treat as URL string
                    page = await canvasClient.getPages(course_id.toString(), page_id.toString()) as Page;
                }
                return {
                    content: page.body || "",
                    title: page.title,
                    course_id,
                    page_id: page.page_id,
                    url: page.url
                };
            } catch (error) {
                console.error("Error fetching page content:", error);
                throw new Error(`Failed to fetch page content: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        }

        case "get_assignment_content": {
            if (!canvasToken) {
                throw new Error("Canvas API token is required");
            }
            const canvasClient = createCanvasClient(canvasToken);
            const {course_id, assignment_id} = input;
            if (!course_id || typeof course_id !== "number") {
                throw new Error("course_id is required and must be a number");
            }
            if (!assignment_id || typeof assignment_id !== "number") {
                throw new Error("assignment_id is required and must be a number");
            }
            try {
                const assignment = await canvasClient.getAssignments(course_id.toString(), assignment_id.toString()) as Assignment;
                return {
                    content: assignment.description || "",
                    name: assignment.name,
                    course_id,
                    assignment_id: assignment.id,
                    due_at: assignment.due_at,
                    unlock_at: assignment.unlock_at,
                    lock_at: assignment.lock_at
                };
            } catch (error) {
                console.error("Error fetching assignment content:", error);
                throw new Error(`Failed to fetch assignment content: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        }

        case "generate_study_guide": {
            const { course_id, token } = input as { course_id?: string; token?: string };
            if (!course_id || !token)
                throw new Error("Missing required inputs for study guide.");

            // Call your existing Next.js backend route that builds the study pack
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/canvas/study-pack`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ courseId: course_id, token }),
                }
            );

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Study guide route failed: ${err}`);
            }

            const data = await res.json();
            return data;
        }
    }
}

type ToolUpdateCallback = (update: { step: number; name: string; status: 'started' | 'completed'; input?: Record<string, unknown>; output?: Record<string, unknown> }) => void;

export async function runWithTools(userText: string, canvasToken?: string | null, onToolUpdate?: ToolUpdateCallback) {
    // const systemPrompt = SYSTEM_PROMPT;
    const conversation: Message[] = [
        {
            role: "user",
            content: [{
                text: userText
            }]
        
}];

    const safetySteps = 5;
    const toolTrace: ToolTraceEntry[] = [];

    for (let step = 0; step < safetySteps; step++) {
        const response = await callConverse(conversation, SYSTEM_PROMPT);
        const stopReason = response.stopReason;
        const assistantMessage = response.output?.message;

        if (!assistantMessage) {
            throw new Error("No assistant message");
        }

        conversation.push(assistantMessage as Message);

        if (stopReason === "tool_use") {
            const toolCalls = extractToolCallsFromMessage(assistantMessage as Message);

            for (const call of toolCalls) {
                if (onToolUpdate) {
                    onToolUpdate({
                        step,
                        name: call.name,
                        status: 'started',
                        input: call.input
                    });
                }

                try {
                    const result = await executeTool(call, canvasToken || null);

                    // Notify that tool execution completed
                    if (onToolUpdate) {
                        onToolUpdate({
                            step,
                            name: call.name,
                            status: 'completed',
                            input: call.input,
                            output: result
                        });
                    }

                    toolTrace.push({
                        step,
                        name: call.name,
                        input: call.input,
                        output: result
                    });

                    const toolResultMessage: Message = {
                        role: "user",
                        content: [
                            {
                                toolResult: {
                                    toolUseId: call.toolUseId,
                                    content: [
                                        {
                                            text: JSON.stringify(result),
                                        },
                                    ],
                                },
                            } as ContentBlock
                        ],
                    };
                    conversation.push(toolResultMessage);
                } catch (error) {
                    // Handle tool execution errors - communicate error through content
                    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                    
                    // Notify that tool execution failed
                    if (onToolUpdate) {
                        onToolUpdate({
                            step,
                            name: call.name,
                            status: 'completed',
                            input: call.input,
                            output: { error: errorMessage }
                        });
                    }

                    toolTrace.push({
                        step,
                        name: call.name,
                        input: call.input,
                        output: { error: errorMessage }
                    });

                    const toolResultMessage: Message = {
                        role: "user",
                        content: [
                            {
                                toolResult: {
                                    toolUseId: call.toolUseId,
                                    content: [
                                        {
                                            text: JSON.stringify({ error: errorMessage }),
                                        },
                                    ],
                                },
                            } as ContentBlock
                        ],
                    };
                    conversation.push(toolResultMessage);
                }
            }
            continue;
        }
        const textBlock = assistantMessage.content?.find((block) => "text" in block && block.text);
        const finalText = textBlock?.text ?? "";
        return {message: assistantMessage, text: finalText, toolTrace};
    }
    throw new Error("passed safety step threshold --> possibly in infinite loop");
}