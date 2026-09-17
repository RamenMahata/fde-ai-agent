import {
  gemini,
  model,
  websiteTools,
} from "../config/gemini.js";

import {
  websiteTools as executableTools,
} from "../tools/website/index.js";

import { safePath } from "../tools/website/safe-path.js";
import path from "node:path";

const systemInstruction = `
You are an expert frontend website developer.

Your job is to create complete static websites using the available tools.

Rules:

1. Create a separate directory for every website.
2. Create index.html.
3. Create style.css.
4. Create script.js when JavaScript is useful.
5. Build modern, beautiful and responsive websites.
6. Use only HTML, CSS and vanilla JavaScript.
7. Do not just return website code in your response.
8. Actually create the files using the available tools.
9. After creating the website, list the project files.
10. Read important files again if needed and fix obvious problems.
11. Finish only when the complete website has been created.
12. Never access files outside the generated-sites workspace.
`;

async function generateContentWithRetry(request) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await gemini.models.generateContent(request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isQuotaExceeded =
        error.status === 429 &&
        /(quota|resource exhausted|GenerateRequestsPerDay|GenerateContent.*FreeTier)/i.test(errorMessage);

      if (isQuotaExceeded) {
        error.code = "GEMINI_QUOTA_EXCEEDED";
        throw error;
      }

      const isTransient = [429, 500, 503].includes(error.status);

      if (!isTransient || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = 500 * 2 ** (attempt - 1);
      console.warn(
        `Gemini request failed with ${error.status}; retrying in ${delayMs}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export async function runWebsiteAgent(message) {
  const maxTurns = 12;
  let projectPath;
  let files = [];
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: message,
        },
      ],
    },
  ];

  for (let turn = 1; turn <= maxTurns; turn += 1) {
    console.log(`Website Agent turn ${turn} using model: ${model}`);

    const response = await generateContentWithRetry({
      model,
      contents,
      config: {
        systemInstruction,
        tools: [websiteTools],
      },
    });

    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      const projectId = projectPath && path.basename(safePath(projectPath));

      return {
        text: response.text || "Website created successfully.",
        projectId,
        files,
        previewUrl: projectId ? `/api/websites/preview/${encodeURIComponent(projectId)}/index.html` : null,
      };
    }

    const toolResults = [];

    for (const functionCall of functionCalls) {
      const { name, args = {} } = functionCall;

      console.log("Website Agent requested tool:", name);
      console.log("Arguments:", args);

      if (name === "createDirectory" && typeof args.path === "string") {
        const candidatePath = args.path.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
        if (candidatePath && !candidatePath.includes("..")) {
          projectPath = candidatePath.split("/")[0];
        }
      }

      const tool = executableTools[name];

      if (!tool) {
        throw new Error(`Unknown website tool: ${name}`);
      }

      let result;

      try {
        result = await tool(args);
      } catch (error) {
        console.error(`Website tool failed: ${name}`, error);
        throw new Error(`Website tool '${name}' failed: ${error.message}`, {
          cause: error,
        });
      }

      console.log(`Website tool completed: ${name}`);

      toolResults.push({
        functionResponse: {
          name,
          response: {
            result,
          },
        },
      });

      if (name === "listFiles" && typeof result === "string") {
        files = result.split("\n").map((file) => file.trim()).filter(Boolean);
        if (!projectPath && files[0]) {
          projectPath = files[0].split("/")[0];
        }
      }
    }

    contents.push(response.candidates[0].content);

    contents.push({
      role: "user",
      parts: toolResults,
    });
  }

  throw new Error(`Website agent exceeded the ${maxTurns}-turn tool limit`);
}