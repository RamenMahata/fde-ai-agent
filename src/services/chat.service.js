import { gemini, model } from "../config/gemini.js";
import { runAgent } from "../services/agent.service.js";

export async function chatWithGemini(message) {
    return runAgent(message);
}