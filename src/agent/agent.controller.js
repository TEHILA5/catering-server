const agentService = require('./agent.service');
const responseHandler = require('../utils/responseHandler');

const chat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return responseHandler.error(res, 'נדרשת הודעה', 400);
    }

    // history = כל התורות הקודמים בשיחה שהלקוח שומר ושולח בכל בקשה.
    // חייב להיות מערך; אם הגיע משהו אחר נתעלם ממנו (השירות גם מנרמל בעצמו).
    if (history !== undefined && !Array.isArray(history)) {
      return responseHandler.error(res, 'history חייב להיות מערך', 400);
    }

    const { reply, toolResults, historyTurns } = await agentService.chat(message.trim(), {
      isAuthenticated: !!req.user,
      user: req.user || null,
      history: history || [],
    });

    responseHandler.success(res, { reply, toolResults, historyTurns });
  } catch (error) {
    // Log the full error (including stack) so the real cause is visible in the terminal.
    console.error('[Agent] chat failed:', error);

    // Gemini quota / rate-limit errors are an upstream availability problem, not a
    // bug in our request handling. Surface them as 429 with an honest message so the
    // client (and we) can tell them apart from genuine server faults.
    if (agentService.isQuotaError(error)) {
      return responseHandler.error(
        res,
        'שירות ה-AI חרג כרגע ממכסת השימוש (Gemini). נסה שוב מאוחר יותר.',
        429
      );
    }

    responseHandler.error(res, 'שגיאה בשירות הסוכן. נסה שוב מאוחר יותר.', 500);
  }
};

module.exports = { chat };
