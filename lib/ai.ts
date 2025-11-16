import { BedrockRuntimeClient, ConverseCommand, ConverseCommandInput, Message } from "@aws-sdk/client-bedrock-runtime";
import { toolSchemas } from "./functions";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

async function callConverse(messages: Message[]) {
    const input: ConverseCommandInput = {
        modelId: process.env.BEDROCK_MODEL_ID,
        messages,
        toolConfig: {
            tools: toolSchemas as any
        }
    };

    const command = new ConverseCommand(input);
    const response = await client.send(command);
    return response;
}

type ToolCall = {
    toolUseId: string,
    name: string,
    input: any
}

function extractToolCallsFromMessage(message: Message): ToolCall[] {
    const toolCalls: ToolCall[] = [];

    for (const block of message.content ?? []) {
        if ((block as any).toolUse) {
            const toolUse = (block as any).toolUse;
            toolCalls.push({
                toolUseId: toolUse.toolUseId,
                name: toolUse.name,
                input: toolUse.input
            });
        }
    }
    return toolCalls;
}

async function executeTool(call: ToolCall): Promise<any> {
    const {name, input} = call;

    switch(name) {
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

export async function runWithTools(userText: string) {
    const conversation: Message[] = [
        {
            role: "user",
            content: [{
                text: userText
            }]
        }
    ];

    const safetySteps = 5;

    for (let step = 0; step < safetySteps; step++) {
        const response = await callConverse(conversation);
        const stopReason = response.stopReason;
        const assistantMessage = response.output?.message;

        if (!assistantMessage) {
            throw new Error("No assistant message");
        }

        conversation.push(assistantMessage as Message);

        if (stopReason === "tool_use") {
            const toolCalls = extractToolCallsFromMessage(assistantMessage as Message);

            for (const call of toolCalls) {
                const result = await executeTool(call);

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
                        } as any
                    ],
                };
                conversation.push(toolResultMessage);
            }
            continue;
        }
        const textBlock = assistantMessage.content?.find((block: any) => block.text);
        const finalText = textBlock?.text ?? "";
        return {message: assistantMessage, text: finalText};
    }
    throw new Error("passed safety step threshold --> possibly in infinite loop");
}