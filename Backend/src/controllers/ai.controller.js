const path = require("path");
const { askAgent } = require("../../Ai.model");

/**
 * Handle AI chat question
 * POST /api/ai/chat
 */
const handleChat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "A prompt or message is required to get a response from the AI model.",
      });
    }

    const businessContext = req.business
      ? {
          businessId: req.business._id || req.business.id,
          businessName: req.business.businessName || req.business.name,
          currency: req.business.currency || "INR",
        }
      : req.headers["x-business-id"]
      ? { businessId: req.headers["x-business-id"] }
      : null;

    const reply = await askAgent({
      message,
      history: Array.isArray(history) ? history : [],
      businessContext,
    });

    return res.status(200).json({
      success: true,
      reply,
      model: "openai/gpt-oss-120b",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AiController] Error invoking AI model:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate AI response. Please try again.",
    });
  }
};

/**
 * Health & Model info
 * GET /api/ai/status
 */
const getStatus = async (req, res) => {
  return res.status(200).json({
    success: true,
    status: "online",
    provider: "Groq",
    model: "openai/gpt-oss-120b",
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  handleChat,
  getStatus,
};
