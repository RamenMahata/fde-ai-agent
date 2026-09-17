import { chatWithGemini } from "../services/chat.service.js";

export async function chat(req, res) {
    try {
        const { message } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid input. Please provide a valid message.",
            });
        }

        const response = await chatWithGemini(message);

        return res.status(200).json({
            success: true,
            message: response,
        });
    } catch (error) {
        console.error("Error in chat controller:", error);

        const status = error.status === 429 ? 429 : 500;
        const message =
            status === 429
                ? "Gemini API quota exceeded. Please try again later or use an API key with available quota."
                : "An error occurred while processing your request.";

        return res.status(status).json({
            success: false,
            message,
        });
    }
}