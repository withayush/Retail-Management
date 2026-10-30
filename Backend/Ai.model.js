require("dotenv").config(); // .env file se API key load karne ke liye
const { ChatGroq } = require("@langchain/groq");
const mongoose = require("mongoose");
const { createDatabaseTools } = require("./src/services/aiTools.service");

// Configure the Groq AI Model with low temperature (0.1) for accurate database data analysis
const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-120b",
  temperature: 0.1,
});

/**
 * Intelligent Database-Aware AI Agent
 * - Automatically decides whether a user question requires live MongoDB data
 * - Executes safe Read-Only database tools scoped to the business
 * - Returns structured Markdown answers with tables and business metrics
 *
 * @param {Object} params
 * @param {string} params.message - Current user query
 * @param {Array} [params.history] - Array of { role: 'user'|'assistant', content: string }
 * @param {Object} [params.businessContext] - Details about current business/store
 * @returns {Promise<string>} Final AI generated answer
 */
async function askAgent({ message, history = [], businessContext = null }) {
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message is required and cannot be empty.");
  }

  const businessId = businessContext?.businessId || businessContext?._id || null;
  const storeName = businessContext?.businessName || businessContext?.name || "Vendor Store";

  // 1. Initialize MongoDB Database Tools
  const tools = createDatabaseTools(businessId);
  const toolMap = new Map(tools.map((t) => [t.name, t]));
  const modelWithTools = model.bindTools(tools);

  // 2. System Prompt instructing AI to use tools for real data
  const systemInstructions = [
    `You are VendorOS AI Copilot, an expert AI retail and ERP analyst connected directly to the store's live MongoDB database.`,
    `Current Active Store: "${storeName}".`,
    "",
    "DATABASE TOOL RULES:",
    "- When the user asks about stock, products, low inventory, sales, revenue, invoices, customers, khata/udhaar, suppliers, or expenses, ALWAYS invoke the appropriate database tool to fetch real records.",
    "- Do not invent or guess business data. Always query the tools for facts and metrics.",
    "- For general queries unrelated to store data (e.g. 'Why do parrots talk?' or general marketing advice), answer directly without calling tools.",
    "",
    "FORMATTING GUIDELINES:",
    "1. Structure your answer with clear Markdown headings (e.g. `## Inventory Summary`, `## Outstanding Khata Balances`).",
    "2. Present tabular data in clean GitHub-Flavored Markdown tables with headers (`| Item | Stock | Status |`).",
    "3. Highlight key numbers and totals in **bold** (e.g. `**Total Revenue: ₹14,250**`).",
    "4. Provide actionable insights based on the database data returned (e.g. recommend reordering items with stock below reorder level).",
  ];

  const messages = [
    { role: "system", content: systemInstructions.join("\n") },
  ];

  // Append recent conversation history
  if (Array.isArray(history) && history.length > 0) {
    const recent = history.slice(-6);
    for (const h of recent) {
      if (h.role === "user" || h.role === "human") {
        messages.push({ role: "user", content: h.content || "" });
      } else if (h.role === "assistant" || h.role === "ai") {
        messages.push({ role: "assistant", content: h.content || "" });
      }
    }
  }

  // Append current user message
  messages.push({ role: "user", content: message.trim() });

  // 3. Step 1: Model evaluates prompt & decides if database tools are needed
  let currentResponse = await modelWithTools.invoke(messages);
  let iterations = 0;

  // 4. Step 2: Loop to execute tool calls until model generates final textual answer (max 4 turns)
  while (
    currentResponse.tool_calls &&
    currentResponse.tool_calls.length > 0 &&
    iterations < 4
  ) {
    iterations++;
    messages.push(currentResponse);

    for (const call of currentResponse.tool_calls) {
      const selectedTool = toolMap.get(call.name);
      if (selectedTool) {
        try {
          const toolData = await selectedTool.invoke(call.args);
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: typeof toolData === "string" ? toolData : JSON.stringify(toolData),
          });
        } catch (toolErr) {
          console.error(`[Tool Execution Error] ${call.name}:`, toolErr.message);
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({ error: toolErr.message }),
          });
        }
      }
    }

    currentResponse = await modelWithTools.invoke(messages);
  }

  const responseText =
    typeof currentResponse.content === "string"
      ? currentResponse.content
      : JSON.stringify(currentResponse.content);

  return responseText && responseText.trim()
    ? responseText
    : "Live database records were checked, but no text was generated. Please try again or rephrase.";
}

// ── Standalone CLI Demo: `node Ai.model.js` ──
async function main() {
  try {
    if (mongoose.connection.readyState === 0 && process.env.MONGO_URI) {
      console.log("Connecting to MongoDB...");
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected for AI Agent CLI demo.");
    }

    const testQuestion = "Check database and show me an overview of our store inventory and low stock items.";
    console.log(`\nUser: "${testQuestion}"\nThinking & querying database...\n`);

    const answer = await askAgent({ message: testQuestion });
    console.log("AI Agent Response:\n");
    console.log(answer);
  } catch (error) {
    console.error("Error running AI Agent:", error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  model,
  askAgent,
};