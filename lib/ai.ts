import { BedrockRuntimeClient, ConverseCommand, ConverseCommandInput, Message } from "@aws-sdk/client-bedrock-runtime";
import { toolSchemas } from "./functions";
import { Tool } from "@aws-sdk/client-bedrock-runtime";
import { ContentBlock } from "@aws-sdk/client-bedrock-runtime";
import { createCanvasClient } from "./canvas";
import type { Assignment, Page, Module, ModuleItem, Quiz, File } from "@/types/canvas";
import { SYSTEM_PROMPT } from './system_prompt';


const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

async function callConverse(messages: Message[], systemPrompt = SYSTEM_PROMPT) {
    if (!process.env.BEDROCK_MODEL_ID) {
        throw new Error("BEDROCK_MODEL_ID environment variable is not set");
    }
    
    const input: ConverseCommandInput = {
        modelId: process.env.BEDROCK_MODEL_ID,
        messages,
        system: [{text: systemPrompt}],
        toolConfig: {
            tools: toolSchemas as unknown as Tool[]
        }
    };

    const command = new ConverseCommand(input);
    try {
        const response = await client.send(command);
        return response;
    } catch (error) {
        console.error("Bedrock API call failed:", error);
        throw error;
    }
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
const CANVAS_TOOLS = [
    "get_courses", 
    "get_modules", 
    "get_pages",
    "get_page_content", 
    "get_assignments",
    "get_assignment_content",
    "get_quizzes",
    "get_quiz_content",
    "get_files"
];

async function executeTool(call: ToolCall, canvasToken: string | null): Promise<Record<string, unknown>> {
    const {name, input} = call;

    // Check if this is a Canvas tool that requires authentication
    if (CANVAS_TOOLS.includes(name)) {
        if (!canvasToken) {
            throw new Error("Canvas API token is required to use Canvas tools. Please link your Canvas account first.");
        }
    }

    switch(name) {
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
                
                // Fetch module items for each module to provide full context
                const modulesWithItems = await Promise.all(
                    modulesArray.map(async (module: Module) => {
                        try {
                            const items = await canvasClient.getModuleItems(course_id.toString(), module.id.toString());
                            const itemsArray = Array.isArray(items) ? items : [items];
                            return {
                                ...module,
                                items: itemsArray
                            };
                        } catch (error) {
                            // If we can't fetch items, return module without items
                            console.warn(`Could not fetch items for module ${module.id}:`, error);
                            return {
                                ...module,
                                items: []
                            };
                        }
                    })
                );
                
                return {modules: modulesWithItems, course_id};
            } catch (error) {
                console.error("Error fetching modules:", error);
                throw new Error(`Failed to fetch modules: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        }

        case "get_pages": {
            if (!canvasToken) {
                throw new Error("Canvas API token is required");
            }
            const canvasClient = createCanvasClient(canvasToken);
            const {course_id} = input;
            if (!course_id || typeof course_id !== "number") {
                throw new Error("course_id is required and must be a number");
            }
            try {
                const pages = await canvasClient.getPages(course_id.toString());
                const pagesArray = Array.isArray(pages) ? pages : [pages];
                return {
                    pages: pagesArray.map((p: Page) => ({
                        title: p.title,
                        url: p.url,
                        page_id: (p as any).page_id || null,
                        created_at: p.created_at,
                        updated_at: p.updated_at
                    })),
                    course_id
                };
            } catch (error) {
                console.error("Error fetching pages:", error);
                throw new Error(`Failed to fetch pages: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        }

        case "get_page_content": {
            if (!canvasToken) {
                throw new Error("Canvas API token is required");
            }
            const canvasClient = createCanvasClient(canvasToken);
            const {course_id, page_url} = input;
            if (!course_id || typeof course_id !== "number") {
                throw new Error("course_id is required and must be a number");
            }
            if (!page_url || typeof page_url !== "string") {
                throw new Error("page_url is required and must be a string (page slug)");
            }
            try {
                const page = await canvasClient.getPages(course_id.toString(), page_url) as Page;
                return {
                    content: page.body || "",
                    title: page.title,
                    course_id,
                    page_id: (page as any).page_id || null,
                    url: page.url,
                    created_at: page.created_at,
                    updated_at: page.updated_at
                };
            } catch (error) {
                console.error("Error fetching page content:", error);
                throw new Error(`Failed to fetch page content: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        }

        case "get_assignments": {
            if (!canvasToken) {
                throw new Error("Canvas API token is required");
            }
            const canvasClient = createCanvasClient(canvasToken);
            const {course_id} = input;
            if (!course_id || typeof course_id !== "number") {
                throw new Error("course_id is required and must be a number");
            }
            try {
                const assignments = await canvasClient.getAssignments(course_id.toString());
                const assignmentsArray = Array.isArray(assignments) ? assignments : [assignments];
                return {
                    assignments: assignmentsArray.map((a: Assignment) => ({
                        id: a.id,
                        name: a.name,
                        due_at: a.due_at,
                        unlock_at: a.unlock_at,
                        lock_at: a.lock_at,
                        course_id: a.course_id
                    })),
                    course_id
                };
            } catch (error) {
                console.error("Error fetching assignments:", error);
                throw new Error(`Failed to fetch assignments: ${error instanceof Error ? error.message : "Unknown error"}`);
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

        case "get_quizzes": {
            if (!canvasToken) {
                throw new Error("Canvas API token is required");
            }
            const canvasClient = createCanvasClient(canvasToken);
            const {course_id} = input;
            if (!course_id || typeof course_id !== "number") {
                throw new Error("course_id is required and must be a number");
            }
            try {
                const quizzes = await canvasClient.getQuizzes(course_id.toString());
                const quizzesArray = Array.isArray(quizzes) ? quizzes : [quizzes];
                return {
                    quizzes: quizzesArray.map((q: Quiz) => ({
                        id: q.id,
                        title: q.title,
                        quiz_type: q.quiz_type,
                        due_at: q.due_at,
                        course_id: q.course_id
                    })),
                    course_id
                };
            } catch (error) {
                console.error("Error fetching quizzes:", error);
                throw new Error(`Failed to fetch quizzes: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        }

        case "get_quiz_content": {
            if (!canvasToken) {
                throw new Error("Canvas API token is required");
            }
            const canvasClient = createCanvasClient(canvasToken);
            const {course_id, quiz_id} = input;
            if (!course_id || typeof course_id !== "number") {
                throw new Error("course_id is required and must be a number");
            }
            if (!quiz_id || typeof quiz_id !== "number") {
                throw new Error("quiz_id is required and must be a number");
            }
            try {
                const quiz = await canvasClient.getQuizzes(course_id.toString(), quiz_id.toString()) as Quiz;
                return {
                    content: quiz.description || "",
                    title: quiz.title,
                    quiz_type: quiz.quiz_type,
                    course_id,
                    quiz_id: quiz.id,
                    due_at: quiz.due_at
                };
            } catch (error) {
                console.error("Error fetching quiz content:", error);
                throw new Error(`Failed to fetch quiz content: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        }

        case "get_files": {
            if (!canvasToken) {
                throw new Error("Canvas API token is required");
            }
            const canvasClient = createCanvasClient(canvasToken);
            const {course_id} = input;
            if (!course_id || typeof course_id !== "number") {
                throw new Error("course_id is required and must be a number");
            }
            try {
                const files = await canvasClient.getFiles(course_id.toString());
                const filesArray = Array.isArray(files) ? files : [files];
                return {
                    files: filesArray.map((f: File) => ({
                        id: f.id,
                        display_name: f.display_name,
                        filename: f.filename,
                        url: f.url,
                        content_type: f.content_type,
                        size: f.size,
                        created_at: f.created_at,
                        updated_at: f.updated_at
                    })),
                    course_id
                };
            } catch (error) {
                console.error("Error fetching files:", error);
                throw new Error(`Failed to fetch files: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        }

        case "generate_study_pack": {
            // This tool doesn't require Canvas authentication
            const {content, material_type} = input;
            if (!content || typeof content !== "string") {
                throw new Error("content is required and must be a string");
            }
            if (!material_type || typeof material_type !== "string") {
                throw new Error("material_type is required and must be a string");
            }
            // For now, return a simple summary. This could be enhanced to use the LLM to generate study materials
            // The LLM should use this tool to signal that it's ready to generate study materials from the gathered content
            return {
                summary: `Study pack ready for ${material_type} material. Content length: ${content.length} characters. The assistant should now generate study materials based on this content.`,
                content_length: content.length,
                material_type
            };
        }

        default:
            throw new Error(`Unknown tool ${name}`);
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

    const safetySteps = 20;
    const toolTrace: ToolTraceEntry[] = [];

    for (let step = 0; step < safetySteps; step++) {
        let response;
        try {
            response = await callConverse(conversation, SYSTEM_PROMPT);
        } catch (error) {
            console.error("Error calling Bedrock API:", error);
            throw new Error(`Failed to communicate with AI model: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        
        const stopReason = response.stopReason;
        const assistantMessage = response.output?.message;

        if (!assistantMessage) {
            console.error("No assistant message in response:", response);
            throw new Error("No assistant message received from AI model");
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