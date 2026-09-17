import { runWebsiteAgent } from "../services/website-agent.service.js";

export async function generateWebsite(req, res) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const response = await runWebsiteAgent(message);

    return res.status(200).json({
      success: true,
      response: response.text,
      projectId: response.projectId,
      files: response.files,
      previewUrl: response.previewUrl,
    });
  } catch (error) {
    console.error("Website Controller Error:", error);

    const status = error?.code === "GEMINI_QUOTA_EXCEEDED" || error?.status === 429
      ? 429
      : [400, 401, 403, 404].includes(error?.status)
        ? error.status
        : 500;

    const message = error?.code === "GEMINI_QUOTA_EXCEEDED"
      ? "Gemini quota exhausted. Wait for the quota to reset or use a project with available billing quota."
      : status === 429
        ? "Gemini is temporarily rate-limited. Please try again shortly."
        : "Failed to generate website";

    return res.status(status).json({
      success: false,
      code: error?.code || "WEBSITE_GENERATION_FAILED",
      message,
    });
  }
}