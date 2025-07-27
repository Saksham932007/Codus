# Terminal AI Agent powered by Gemini

This project is a powerful, interactive AI agent that runs directly in your terminal. Built with Node.js and powered by the Google Gemini API, this agent can understand complex queries, break them down into steps, and use tools to interact with your local system, such as creating and writing files.

It's designed to be a foundation for building more complex autonomous agents that can perform a variety of tasks, from simple calculations to generating entire codebases.
✨ Features

    Conversational Interface: Interact with the agent in a natural, conversational way directly from your command line.

    Gemini-Powered Intelligence: Leverages the advanced reasoning capabilities of Google's Gemini Pro model.

    Step-by-Step Task Processing: The agent follows a THINK -> ACTION -> OBSERVE -> OUTPUT loop, making its reasoning process transparent and easy to follow.

    Extensible Tool System: Easily add new capabilities to the agent by defining custom tools (functions) that it can learn to use.

    File System Access: Comes with a built-in writeFile tool, allowing the agent to create and write code, notes, or any other text-based files directly to your local machine.

    Interactive and User-Friendly: Color-coded output helps distinguish between the agent's thoughts, actions, and final output.

⚙️ How It Works

The agent operates on a simple yet effective loop. When you provide a query, the agent:

    THINKS: It analyzes your request and formulates a plan. For a coding task, this involves deciding which files and what content are needed.

    ACTS: It executes a tool to move forward with its plan. This could be calling the writeFile tool to create a file or another tool for a different task.

    OBSERVES: It takes the result from the tool's execution (e.g., "File written successfully") and adds it to its memory.

    LOOPS or OUTPUTS: If the plan is not complete, it loops back to the THINK step. Once all actions are done, it provides a final OUTPUT summarizing what it has accomplished.

🚀 Getting Started

Follow these instructions to get the AI agent running on your local machine.
Prerequisites

    Node.js (v18 or later is recommended)

    A Google Gemini API Key. You can get one from Google AI Studio.

Installation & Setup

    Clone the repository:

    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name

    Set up your Gemini API Key:
    You need to set your API key as an environment variable. Open your terminal and use the command for your operating system:

        macOS / Linux:

        export GEMINI_API_KEY="YOUR_API_KEY_HERE"

        Windows (Command Prompt):

        set GEMINI_API_KEY=YOUR_API_KEY_HERE

        Windows (PowerShell):

        $env:GEMINI_API_KEY="YOUR_API_KEY_HERE"

        Note: Replace YOUR_API_KEY_HERE with your actual Gemini API key.

    Run the agent:

    node agent.js

Usage

Once the script is running, you'll be prompted to enter a query. You can ask it to perform tasks that involve its available tools.

Example 1: Simple Calculation

Enter your query: What is 123 plus 456?

Example 2: Creating a Website

Enter your query: Build a simple HTML landing page for a tech product.

The agent will then start its process, and you will see its THINK, ACTION, and OBSERVE steps as it creates the index.html and styles.css files in your project directory.
🔧 Extending the Agent

You can easily add new tools to the agent.

    Define the Function: Create a new JavaScript function in agent.js that performs the desired action.

    Update the System Prompt: Add the new tool's name and a description of what it does and how to use it to the SYSTEM_PROMPT string.

    Handle the Tool in runConversation: Add an else if block to the action step to call your new function when the agent decides to use it.
