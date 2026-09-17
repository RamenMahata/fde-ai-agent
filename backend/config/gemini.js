import { GoogleGenAI } from "@google/genai";
import { env } from "./env.js";

if (!env.geminiApiKey || env.geminiApiKey === "YOUR_API_KEY_HERE") {
    console.warn("GEMINI_API_KEY is missing or still set to the placeholder value.");
}

export const gemini = new GoogleGenAI({
    apiKey: env.geminiApiKey,
});

export const model = env.geminiModel;

export const functionDeclarations = [
    {
        name: "calculate",
        description: "Performs basic arithmetic operations. Supported operations: add, subtract, multiply, divide, mod, power.",
        parametersJsonSchema: {
            type: "object",
            properties: {
                operation: {
                    type: "string",
                    description: "The arithmetic operation to perform. Supported operations: add, subtract, multiply, divide, mod, power.",
                },
                a: {
                    type: "number",
                    description: "The first number for the operation.",
                },
                b: {
                    type: "number",
                    description: "The second number for the operation.",
                },
            },
            required: ["operation", "a", "b"],
            additionalProperties: false,
        },
    },
    {
        name: "currentWeather",
        description: "Fetches the current weather for a specified city.",
        parametersJsonSchema: {
            type: "object",
            properties: {
                city: {
                    type: "string",
                    description: "The name of the city to fetch the weather for.",
                },
            },
            required: ["city"],
            additionalProperties: false,
        },
    },
    {
        name: "getExchangeRate",
        description: "Fetches the current exchange rate between two currencies.",
        parametersJsonSchema: {
            type: "object",
            properties: {
                fromCurrency: {
                    type: "string",
                    description: "The currency code to convert from (e.g., USD).",
                },
                toCurrency: {
                    type: "string",
                    description: "The currency code to convert to (e.g., EUR).",
                },
            },
            required: ["fromCurrency", "toCurrency"],
            additionalProperties: false,
        },
    },
];

export const websiteTools = {
  functionDeclarations: [
    {
      name: "createDirectory",
      description:
        "Creates a directory inside the generated-sites workspace.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Relative directory path, for example portfolio",
          },
        },
        required: ["path"],
      },
    },

    {
      name: "writeFile",
      description:
        "Creates or overwrites a text file inside the generated-sites workspace.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Relative file path, for example portfolio/index.html",
          },
          content: {
            type: "string",
            description:
              "Complete content that should be written into the file.",
          },
        },
        required: ["path", "content"],
      },
    },

    {
      name: "readFile",
      description:
        "Reads the contents of an existing file inside the generated-sites workspace.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Relative file path.",
          },
        },
        required: ["path"],
      },
    },

    {
      name: "listFiles",
      description:
        "Lists all files and directories inside a website project.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Relative directory path, for example portfolio.",
          },
        },
        required: ["path"],
      },
    },
  ],
};