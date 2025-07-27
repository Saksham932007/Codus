// To run this script, you need Node.js installed.
// 1. Save this code as a file, for example, `agent.js`.
// 2. Open your terminal or command prompt.
// 3. Set your Gemini API key as an environment variable.
//    - On macOS/Linux: export GEMINI_API_KEY="YOUR_API_KEY"
//    - On Windows (Command Prompt): set GEMINI_API_KEY=YOUR_API_KEY
//    - On Windows (PowerShell): $env:GEMINI_API_KEY="YOUR_API_KEY"
// 4. Run the script with the command: `node agent.js`

const readline = require("readline");
const fs = require("fs");
const path = require("path");

// --- Configuration ---
const GEMINI_API_KEY = "api key";
if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are a helpful assistant designed to solve user queries, including writing code and files to the local system.
You operate in a loop with the following steps: THINK, ACTION, OBSERVE, and OUTPUT.

1.  **START**: The user provides a query.
2.  **THINK**: You break down the problem and create a plan. For coding tasks, think about the file structure (e.g., which files to create, like index.html, styles.css). You must think at least once. Your thoughts should be clear and explain your reasoning for the next step.
3.  **ACTION**: If a tool is needed, you call an ACTION with the tool name and the required input. To create or write to a file, use the 'writeFile' tool.
4.  **OBSERVE**: After an action, you will receive an observation. This is the output from the tool (e.g., "File written successfully.").
5.  **OUTPUT**: Based on your thoughts and observations, you provide the final answer to the user. This is usually done after all files have been created.

**Rules:**
- You must always respond in a single, valid JSON object.
- Always start with a "think" step.
- Only call tools that are available.
- For the 'writeFile' tool, the 'input' field must be a JSON object with "filePath" and "fileContent" keys.
- The loop continues until you have enough information or have completed all actions to use the "output" step.

**Available Tools:**
- \`addTwoNumbers(x, y)\`: Adds two numbers together. Input should be a comma-separated string of two numbers (e.g., "10,20").
- \`writeFile(input)\`: Writes content to a local file. The input must be a JSON object: { "filePath": "path/to/file.ext", "fileContent": "content to write" }.

**Output Format (Strict JSON):**
{
  "step": "think" | "action" | "output",
  "tool": "addTwoNumbers" | "writeFile" | null,
  "input": string | object,
  "content": string
}`;

let chatHistory = [];

// --- Tool Definitions ---
function addTwoNumbers(x, y) {
  return x + y;
}

/**
 * Writes content to a local file, creating directories if they don't exist.
 * @param {string} filePath - The path to the file (e.g., 'src/index.html').
 * @param {string} fileContent - The content to write to the file.
 * @returns {string} A status message.
 */
function writeFile(filePath, fileContent) {
  try {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    fs.writeFileSync(filePath, fileContent);
    return `Successfully wrote ${fileContent.length} bytes to ${filePath}`;
  } catch (error) {
    return `Error writing file: ${error.message}`;
  }
}

// --- Terminal UI ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function printStep(type, text) {
  const colors = {
    think: "\x1b[33m", // Yellow
    action: "\x1b[34m", // Blue
    observe: "\x1b[35m", // Magenta
    output: "\x1b[32m", // Green
    error: "\x1b[31m", // Red
    reset: "\x1b[0m",
  };
  console.log(
    `${colors[type] || ""}[${type.toUpperCase()}] ${text}${colors.reset}`
  );
}

// --- Core Agent Logic ---

/**
 * Calls the Gemini API with the current chat history.
 * @returns {Promise<object>} The parsed JSON response from the API.
 */
async function callGemini() {
  try {
    const payload = {
      contents: chatHistory,
      generationConfig: {
        responseMimeType: "application/json",
      },
    };
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0) {
      const rawText = result.candidates[0].content.parts[0].text;
      // Sometimes the model returns the JSON wrapped in markdown backticks
      const cleanedText = rawText
        .replace(/^```json\n?/, "")
        .replace(/\n?```$/, "");
      return JSON.parse(cleanedText);
    } else if (result.promptFeedback) {
      throw new Error(
        `API blocked the prompt. Reason: ${result.promptFeedback.blockReason}`
      );
    } else {
      throw new Error("Invalid response structure from API.");
    }
  } catch (error) {
    printStep(
      "error",
      `Error calling Gemini API or parsing response: ${error.message}`
    );
    return null;
  }
}

/**
 * Main conversation loop for the agent.
 */
async function runConversation() {
  console.log("Agent is processing...");

  while (true) {
    const response = await callGemini();

    if (!response) {
      break; // Error occurred, exit loop
    }

    chatHistory.push({
      role: "model",
      parts: [{ text: JSON.stringify(response) }],
    });

    const { step, tool, input, content } = response;

    if (step === "think") {
      printStep("think", content);
      continue;
    }

    if (step === "action") {
      printStep("action", `Tool: ${tool}, Input: ${JSON.stringify(input)}`);
      let result;

      if (tool === "addTwoNumbers") {
        try {
          const [x, y] = String(input).split(",").map(Number);
          if (isNaN(x) || isNaN(y)) throw new Error("Invalid number input.");
          result = addTwoNumbers(x, y);
        } catch (e) {
          result = `Error executing tool: ${e.message}`;
        }
      } else if (tool === "writeFile") {
        try {
          // The 'input' for writeFile should be an object
          if (
            typeof input !== "object" ||
            input === null ||
            !input.filePath ||
            typeof input.fileContent === "undefined"
          ) {
            throw new Error(
              "Invalid input for writeFile. Expected an object with 'filePath' and 'fileContent'."
            );
          }
          result = writeFile(input.filePath, input.fileContent);
        } catch (e) {
          result = `Error executing tool: ${e.message}`;
        }
      } else {
        result = `Unknown tool: ${tool}`;
      }

      printStep("observe", `Result: ${result}`);

      chatHistory.push({
        role: "user",
        parts: [{ text: JSON.stringify({ step: "observe", output: result }) }],
      });
      continue;
    }

    if (step === "output") {
      printStep("output", content);
      break; // End of conversation
    }
  }
  start();
}

/**
 * Initializes the conversation
 */
function start() {
  rl.question(
    '\x1b[36m\nEnter your query (or type "exit" to close): \x1b[0m',
    async (userQuery) => {
      if (userQuery.toLowerCase() === "exit") {
        rl.close();
        return;
      }

      chatHistory = [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        {
          role: "model",
          parts: [
            {
              text: '{"step": "think", "tool": null, "input": null, "content": "Okay, I understand the instructions. I am a helpful assistant that can write files. I will follow the THINK, ACTION, OBSERVE, OUTPUT loop. I am ready for the user\'s query."}',
            },
          ],
        },
        { role: "user", parts: [{ text: userQuery }] },
      ];

      await runConversation();
    }
  );
}

// --- Script Entry Point ---
console.log("--- Gemini AI Agent (Terminal) ---");
start();
