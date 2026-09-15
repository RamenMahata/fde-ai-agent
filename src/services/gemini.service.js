import { gemini, model } from "../config/gemini.js";

export async function chatWithGemini(message) {
    if (!message || typeof message !== "string") {
        throw new Error("A valid message string is required.");
    }

    const response = await gemini.models.generateContent({
        model,
        contents: message,
    });

    return (
        response?.text ||
        response?.candidates?.[0]?.content?.parts
            ?.map((part) => part?.text || "")
            .join("") ||
        ""
    );
}
