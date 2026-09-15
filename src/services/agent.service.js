import { gemini, model, functionDeclarations } from "../config/gemini.js";
import { chatTools as toolHandlers } from "../tools/chat/index.js";

const systemInstruction = `
You are a helpful AI assistant with access to external tools.

Rules:
1. For arithmetic calculations, ALWAYS use the calculator tool.
2. Always use the calculator tool even for trivial calculations.
3. For current weather, ALWAYS use the currentWeather tool.
4. For currency conversion or exchange rates, ALWAYS use the getExchangeRate tool.
5. You may call multiple tools when solving a multi-step request.
6. After receiving tool results, explain the answer naturally.
7. Never invent current weather or exchange-rate information.
`;

export async function runAgent(message) {
    const contents = [
        {
            role: "user",
            parts: [{ text: message }],
        },
    ];

    while (true) {
        const response = await gemini.models.generateContent({
            model,
            contents,
            config: {
                systemInstruction,
                tools: [{ functionDeclarations }],
            },
        });

        const functionCalls = response.functionCalls || [];

        if (!functionCalls.length) {
            const text = response.text?.trim();

            if (!text) {
                throw new Error("Gemini returned an empty response.");
            }

            return text;
        }

        contents.push(response.candidates[0].content);

        const toolResults = [];

        for (const functionCall of functionCalls) {
            const { name, args } = functionCall;

            console.log("Gemini Requested Tool:", name);
            console.log("Gemini Tool Args:", args);

            const tool = toolHandlers[name];

            if (!tool) {
                throw new Error(`Tool not found: ${name}`);
            }

            const result = await tool(args || {});

            toolResults.push({
                functionResponse: {
                    name,
                    response: {
                        result,
                    },
                },
            });
        }

        contents.push({
            role: "user",
            parts: toolResults,
        });
    }
}