import { BedrockRuntimeClient, ConverseCommand, ConverseCommandInput, Message } from "@aws-sdk/client-bedrock-runtime";
import { toolSchemas } from "./functions";
import { Tool } from "@aws-sdk/client-bedrock-runtime";
import { ContentBlock } from "@aws-sdk/client-bedrock-runtime";
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
            tools: toolSchemas as unknown as Tool[]
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

async function executeTool(call: ToolCall): Promise<Record<string, unknown>> {
    const {name, input} = call;

    switch(name) {
        default:
        throw new Error(`Unknown tool ${name}`);

        case "get_courses": {
            // Canvas
            return {courses: []};
        }

        case "get_modules": {
            const {course_id} = input;
            // Canvas
            return {modules: [], course_id};
        }

        case "get_page_content": {
            const {course_id, page_id} = input;
            // Canvas
            return {content: "", course_id, page_id};
        }

        case "get_assignment_content": {
            const {course_id, assignment_id} = input;
            // Canvas
            return {content: "", course_id, assignment_id};
        }

        case "generate_study_pack": {
            const {content, material_type} = input;
            // Model?
            return {
                summary: "study pack summary",
                content,
                material_type
            }
        }
    }
}

type ToolUpdateCallback = (update: { step: number; name: string; status: 'started' | 'completed'; input?: Record<string, unknown>; output?: Record<string, unknown> }) => void;

export async function runWithTools(userText: string, onToolUpdate?: ToolUpdateCallback) {
    const systemPrompt = "";
    const conversation: Message[] = [
        {
            role: "user",
            content: [{
                text: userText
            }]
        }
    ];

    const safetySteps = 5;
    const toolTrace: ToolTraceEntry[] = [];

    for (let step = 0; step < safetySteps; step++) {
        const response = await callConverse(conversation, systemPrompt);
        const stopReason = response.stopReason;
        const assistantMessage = response.output?.message;

        if (!assistantMessage) {
            throw new Error("No assistant message");
        }

        conversation.push(assistantMessage as Message);

        if (stopReason === "tool_use") {
            const toolCalls = extractToolCallsFromMessage(assistantMessage as Message);

            for (const call of toolCalls) {
                // Notify that tool execution started
                if (onToolUpdate) {
                    onToolUpdate({
                        step,
                        name: call.name,
                        status: 'started',
                        input: call.input
                    });
                }

                const result = await executeTool(call);

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
                })

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
            }
            continue;
        }
        const textBlock = assistantMessage.content?.find((block) => "text" in block && block.text);
        const finalText = textBlock?.text ?? "";
        return {message: assistantMessage, text: finalText, toolTrace};
    }
    throw new Error("passed safety step threshold --> possibly in infinite loop");
}