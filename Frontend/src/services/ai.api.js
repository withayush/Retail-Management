import api from "./api";

/**
 * Send user query to AI model
 * @param {string} message - User query prompt
 * @param {Array} history - Array of { role: 'user'|'assistant', content: string }
 * @returns {Promise<{ success: boolean, reply: string, model: string }>}
 */
export const askAiAgent = async (message, history = []) => {
  const response = await api.post("/ai/chat", {
    message,
    history,
  });
  return response.data;
};

/**
 * Get AI agent status & model info
 */
export const getAiAgentStatus = async () => {
  const response = await api.get("/ai/status");
  return response.data;
};
