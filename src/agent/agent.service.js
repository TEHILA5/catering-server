const { GoogleGenerativeAI } = require('@google/generative-ai');
const dishService = require('../services/dish.service');
const packageService = require('../services/package.service');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `אתה עוזר AI של שירות הקייטרינג "קייטרינג המלך".
תפקידך לעזור ללקוחות לגלות מנות וחבילות קייטרינג, ולענות על כל שאלה הקשורה לשירות.
תמיד ענה בעברית, בטון ידידותי, מקצועי ומועיל.
כשאתה מציג רשימת מנות או חבילות – כתוב משפט פתיחה קצר בלבד. הכרטיסיות יוצגו אוטומטית ללקוח.
גלישה ועיון במנות ובחבילות פתוחים לכולם, גם ללקוחות שאינם מחוברים.
אם הלקוח מבקש לבצע פעולה אישית או מאובטחת (כגון ביצוע הזמנה, צפייה בפרטים האישיים שלו, עדכון פרטים, או פעולות ניהול) והוא אינו מחובר – אל תבצע את הפעולה, אלא הסבר לו בנימוס שעליו להתחבר לחשבון כדי לבצע אותה.`;

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'getDishes',
        description: 'מחזיר רשימת מנות אוכל זמינות. ניתן לסנן לפי קטגוריה.',
        parameters: {
          type: 'OBJECT',
          properties: {
            category: {
              type: 'STRING',
              description:
                'קטגוריה לסינון (למשל: ראשון, עיקרי, קינוח, סלט). השאר ריק כדי לקבל את כל המנות.',
            },
          },
          required: [],
        },
      },
      {
        name: 'getPackages',
        description: 'מחזיר רשימת חבילות קייטרינג זמינות עם פרטי מחיר ותיאור.',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
    ],
  },
];

const executeTool = async (toolName, args) => {
  switch (toolName) {
    case 'getDishes':
      return await dishService.getAllDishes(args);
    case 'getPackages':
      return await packageService.getAllPackages();
    default:
      throw new Error(`כלי לא מוכר: ${toolName}`);
  }
};

// סדר עדיפויות של מודלים: אם הראשון עמוס (503) ננסה את הבא בתור.
const MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// שגיאות שניתן לנסות שוב בעקבותיהן (עומס/זמינות זמנית מצד Google).
const isRetriable = (error) => {
  const msg = error && error.message ? error.message : '';
  return msg.includes('503') || msg.includes('429') || msg.includes('500');
};

/**
 * שולח הודעה למודל עם ניסיונות חוזרים וגיבוי בין מודלים.
 * @returns {Promise<import('@google/generative-ai').ChatSession>}
 */
const sendWithFallback = async (systemInstruction, userMessage) => {
  let lastError;

  for (const modelName of MODEL_FALLBACKS) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
      tools: TOOLS,
    });

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const chatSession = model.startChat({ history: [] });
        const result = await chatSession.sendMessage(userMessage);
        return { chatSession, response: result.response };
      } catch (error) {
        lastError = error;
        if (!isRetriable(error)) throw error;
        await sleep(1000 * (attempt + 1));
      }
    }
  }

  throw lastError;
};

/**
 * @returns {{ reply: string, toolResults: Array<{ name: string, data: any[] }> }}
 */
const chat = async (userMessage, context = {}) => {
  const authNote = context.isAuthenticated
    ? '\nמצב הלקוח הנוכחי: מחובר לחשבון.'
    : '\nמצב הלקוח הנוכחי: אינו מחובר. ניתן לעיין במנות ובחבילות, אך פעולות אישיות/מאובטחות דורשות התחברות.';

  const { chatSession, response: firstResponse } = await sendWithFallback(
    SYSTEM_INSTRUCTION + authNote,
    userMessage
  );
  const functionCalls = firstResponse.functionCalls();

  if (!functionCalls || functionCalls.length === 0) {
    return { reply: firstResponse.text(), toolResults: [] };
  }

  const collectedToolResults = [];
  const toolResponseParts = [];

  for (const call of functionCalls) {
    const data = await executeTool(call.name, call.args || {});
    collectedToolResults.push({ name: call.name, data });
    toolResponseParts.push({
      functionResponse: {
        name: call.name,
        response: { result: data },
      },
    });
  }

  const finalResult = await chatSession.sendMessage(toolResponseParts);
  return {
    reply: finalResult.response.text(),
    toolResults: collectedToolResults,
  };
};

module.exports = { chat };
