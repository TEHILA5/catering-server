const agentService = require('./agent.service');
const responseHandler = require('../utils/responseHandler');

const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return responseHandler.error(res, 'נדרשת הודעה', 400);
    }

    const { reply, toolResults } = await agentService.chat(message.trim(), {
      isAuthenticated: !!req.user,
      user: req.user || null,
    });

    responseHandler.success(res, { reply, toolResults });
  } catch (error) {
    console.error('[Agent] Error:', error.message);
    responseHandler.error(res, 'שגיאה בשירות הסוכן. נסה שוב מאוחר יותר.', 500);
  }
};

module.exports = { chat };
