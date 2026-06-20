const { GoogleGenerativeAI } = require('@google/generative-ai');
const dishService = require('../services/dish.service');
const packageService = require('../services/package.service');
const orderService = require('../services/order.service');

if (!process.env.GEMINI_API_KEY) {
  // Fail loudly at startup rather than producing opaque 500s on the first request.
  console.error('[Agent] Missing GEMINI_API_KEY in environment (.env). Agent chat will not work.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `אתה עוזר AI של שירות הקייטרינג "קייטרינג המלך".
תפקידך לעזור ללקוחות לגלות מנות וחבילות קייטרינג, לבצע ולצפות בהזמנות, ולענות על כל שאלה הקשורה לשירות.
תמיד ענה בעברית, בטון ידידותי, מקצועי ומועיל.
כשאתה מציג רשימת מנות, חבילות או הזמנות – כתוב משפט פתיחה קצר בלבד. הכרטיסיות יוצגו אוטומטית ללקוח.
גלישה ועיון במנות ובחבילות פתוחים לכולם, גם ללקוחות שאינם מחוברים.
אם הלקוח מבקש לבצע פעולה אישית או מאובטחת (כגון ביצוע הזמנה, צפייה בהזמנות שלו, עדכון פרטים, או פעולות ניהול) והוא אינו מחובר – אל תבצע את הפעולה, אלא הסבר לו בנימוס שעליו להתחבר לחשבון כדי לבצע אותה.

הנחיות לביצוע הזמנה (createOrder):
- כדי לבצע הזמנה דרושים: מזהה חבילה (packageId), מספר אורחים (numberOfGuests), תאריך האירוע (eventDate) וכתובת (address).
- הלקוח בדרך כלל יזכיר שם של חבילה ולא מזהה. במקרה כזה קרא תחילה ל-getPackages, מצא את החבילה התואמת לפי השם, וקח את ה-_id שלה בתור packageId.
- אם חסר מידע הכרחי (תאריך, מספר אורחים, כתובת או חבילה) – שאל את הלקוח לפני ביצוע ההזמנה. אל תמציא ערכים.
- המחיר הכולל מחושב אוטומטית על השרת לפי החבילה ומספר האורחים, אין צורך לבקש אותו מהלקוח.
- לכל חבילה יש minGuests — מספר אורחים מינימלי. לפני createOrder, קרא ל-getPackages ובדוק שה-numberOfGuests שווה או גדול מ-minGuests של החבילה. אם הלקוח ביקש פחות — הסבר לו את המינימום ואל תבצע הזמנה.`;

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
      {
        name: 'createOrder',
        description:
          'יוצר הזמנת קייטרינג חדשה עבור הלקוח המחובר. דורש התחברות לחשבון. אם הלקוח נקב בשם חבילה ולא במזהה – יש לקרוא קודם ל-getPackages כדי לאתר את ה-_id התואם.',
        parameters: {
          type: 'OBJECT',
          properties: {
            packageId: {
              type: 'STRING',
              description: 'מזהה החבילה (_id) שהלקוח מזמין.',
            },
            numberOfGuests: {
              type: 'NUMBER',
              description:
                'מספר האורחים באירוע (מספר שלם). חייב להיות לפחות minGuests של החבילה — בדוק ב-getPackages.',
            },
            eventDate: {
              type: 'STRING',
              description: 'תאריך האירוע בפורמט ISO (לדוגמה: 2026-08-15).',
            },
            address: {
              type: 'STRING',
              description: 'כתובת מלאה לאספקת הקייטרינג.',
            },
            selectedItems: {
              type: 'ARRAY',
              description:
                'רשימת מזהי מנות (_id) שנבחרו לחבילה. אופציונלי – ניתן להשאיר ריק.',
              items: { type: 'STRING' },
            },
          },
          required: ['packageId', 'numberOfGuests', 'eventDate', 'address'],
        },
      },
      {
        name: 'getOrdersByUser',
        description:
          'מחזיר את רשימת ההזמנות של הלקוח המחובר. דורש התחברות לחשבון. אין צורך בפרמטרים – הזיהוי נעשה לפי המשתמש המחובר.',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
    ],
  },
];

// כלים הדורשים התחברות לחשבון (פעולות אישיות/מאובטחות).
const AUTH_REQUIRED_TOOLS = new Set(['createOrder', 'getOrdersByUser']);

const executeTool = async (toolName, args, context = {}) => {
  // Personal/secure tools must never run for an anonymous caller, even if the
  // model decided to call them. We hand a structured note back to the model so
  // it can politely ask the user to log in.
  if (AUTH_REQUIRED_TOOLS.has(toolName) && !context.userId) {
    return { error: 'יש להתחבר לחשבון כדי לבצע פעולה זו.' };
  }

  switch (toolName) {
    case 'getDishes':
      return await dishService.getAllDishes(args);
    case 'getPackages':
      return await packageService.getAllPackages();
    case 'createOrder':
      return await orderService.createOrder({
        userId: context.userId,
        packageId: args.packageId,
        selectedItems: args.selectedItems || [],
        numberOfGuests: args.numberOfGuests,
        eventDate: args.eventDate,
        address: args.address,
      });
    case 'getOrdersByUser':
      return await orderService.getByUserId(context.userId);
    default:
      throw new Error(`כלי לא מוכר: ${toolName}`);
  }
};

// קובע האם תוצאת כלי ניתנת להצגה ככרטיסיות בצד הלקוח.
// מערך מוחזר כמו שהוא; אובייקט בודד עם מזהה (כמו הזמנה שנוצרה) נעטף למערך;
// תוצאות שגיאה/ריקות אינן מוצגות (אבל עדיין נמסרות למודל כדי שינסח תשובה).
const toDisplayableArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && !data.error && (data._id || data.id)) {
    return [data];
  }
  return null;
};

// סדר עדיפויות של מודלים: אם הראשון עמוס (503) ננסה את הבא בתור.
const MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// האם מדובר בשגיאת מכסה/הגבלת קצב (429) מצד Gemini.
const isQuotaError = (error) => {
  if (!error) return false;
  if (error.status === 429) return true;
  const msg = error.message ? error.message : String(error);
  return msg.includes('429') || msg.toLowerCase().includes('quota');
};

// מכסה יומית שמוצתה (limit: 0 / PerDay) – אין טעם לנסות שוב, זו בעיה ברמת החשבון/חיוב.
const isDailyQuotaExhausted = (error) => {
  const msg = error && error.message ? error.message : '';
  return msg.includes('limit: 0') || msg.includes('PerDay');
};

// שגיאות שניתן לנסות שוב בעקבותיהן (עומס/זמינות זמנית מצד Google).
// הגבלת קצב רגעית (429) שווה ניסיון חוזר, אך מכסה יומית שמוצתה – לא.
const isRetriable = (error) => {
  const msg = error && error.message ? error.message : '';
  if (msg.includes('503') || msg.includes('500')) return true;
  if (isQuotaError(error) && !isDailyQuotaExhausted(error)) return true;
  return false;
};

/**
 * ממיר היסטוריית שיחה שהגיעה מהלקוח לפורמט שמצפה לו Gemini.
 * הלקוח שולח מערך תורות בפורמט ידידותי: { role: 'user' | 'model', text: string }
 * (גם { content } או { parts } נתמכים), ואנו ממירים ל-{ role, parts: [{ text }] }.
 *
 * אילוצי Gemini שאנו אוכפים כאן:
 * - role חייב להיות 'user' או 'model' בלבד.
 * - תורות ריקות (ללא טקסט) מסוננות.
 * - ההיסטוריה חייבת להתחיל בתור של 'user' – לכן תורות 'model' מובילות נזרקות.
 *
 * ההיסטוריה אמורה לכלול את כל התורות הקודמים אך *לא* את ההודעה החדשה הנוכחית
 * (היא נשלחת בנפרד דרך sendMessage).
 */
const normalizeHistory = (history) => {
  if (!Array.isArray(history)) return [];

  const normalized = [];
  for (const turn of history) {
    if (!turn || typeof turn !== 'object') continue;

    const role = turn.role === 'model' ? 'model' : turn.role === 'user' ? 'user' : null;
    if (!role) continue;

    let text = '';
    if (typeof turn.text === 'string') {
      text = turn.text;
    } else if (typeof turn.content === 'string') {
      text = turn.content;
    } else if (Array.isArray(turn.parts)) {
      text = turn.parts.map((p) => (p && typeof p.text === 'string' ? p.text : '')).join('');
    }

    text = text.trim();
    if (!text) continue;

    normalized.push({ role, parts: [{ text }] });
  }

  // Gemini דורש שההיסטוריה תתחיל בתור 'user'. נשמיט תורות 'model' מובילות.
  while (normalized.length && normalized[0].role === 'model') {
    normalized.shift();
  }

  return normalized;
};

/**
 * שולח הודעה למודל עם ניסיונות חוזרים וגיבוי בין מודלים.
 * @returns {Promise<import('@google/generative-ai').ChatSession>}
 */
const sendWithFallback = async (systemInstruction, userMessage, history = []) => {
  let lastError;

  for (const modelName of MODEL_FALLBACKS) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
      tools: TOOLS,
    });

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // Seed the session with the full prior conversation so the model
        // "remembers" earlier details (package, guests, date, address) instead
        // of re-asking. Previously this was always `history: []`, which is what
        // made every turn behave like a brand-new conversation.
        const chatSession = model.startChat({ history });
        const result = await chatSession.sendMessage(userMessage);
        return { chatSession, response: result.response };
      } catch (error) {
        lastError = error;
        console.error(
          `[Agent] model "${modelName}" attempt ${attempt + 1} failed:`,
          error && error.message
        );

        // This model's daily free-tier quota is spent. Retrying it is pointless,
        // but a different model in MODEL_FALLBACKS may still have quota – so stop
        // retrying THIS model and let the outer loop move on to the next one.
        if (isQuotaError(error) && isDailyQuotaExhausted(error)) break;

        // Genuinely fatal errors (bad API key, malformed request, etc.) won't be
        // fixed by retrying or by another model – fail fast.
        if (!isRetriable(error)) throw error;

        await sleep(1000 * (attempt + 1));
      }
    }
  }

  throw lastError;
};

/**
 * @param {string} userMessage ההודעה החדשה מהלקוח.
 * @param {object} context הקשר הבקשה (משתמש מחובר, היסטוריית שיחה).
 * @param {Array} [context.history] כל התורות הקודמים בשיחה (ללא ההודעה הנוכחית).
 * @returns {{ reply: string, toolResults: Array<{ name: string, data: any[] }> }}
 */
const chat = async (userMessage, context = {}) => {
  const userId = context.user?.id || null;
  const isAuthenticated = !!context.isAuthenticated;
  const history = normalizeHistory(context.history);

  const authNote = isAuthenticated
    ? '\nמצב הלקוח הנוכחי: מחובר לחשבון.'
    : '\nמצב הלקוח הנוכחי: אינו מחובר. ניתן לעיין במנות ובחבילות, אך פעולות אישיות/מאובטחות (כמו ביצוע הזמנה או צפייה בהזמנות) דורשות התחברות.';

  const { chatSession, response: firstResponse } = await sendWithFallback(
    SYSTEM_INSTRUCTION + authNote,
    userMessage,
    history
  );
  const functionCalls = firstResponse.functionCalls();

  if (!functionCalls || functionCalls.length === 0) {
    return { reply: firstResponse.text(), toolResults: [] };
  }

  const collectedToolResults = [];
  const toolResponseParts = [];

  for (const call of functionCalls) {
    const data = await executeTool(call.name, call.args || {}, { userId });

    // Only surface displayable data to the client (arrays / created entities).
    const displayable = toDisplayableArray(data);
    if (displayable && displayable.length) {
      collectedToolResults.push({ name: call.name, data: displayable });
    }

    // The model always gets the raw result so it can phrase the reply (or relay errors).
    toolResponseParts.push({
      functionResponse: {
        name: call.name,
        response: { result: data },
      },
    });
  }

  const finalResult = await chatSession.sendMessage(toolResponseParts);
  return { reply: finalResult.response.text(), toolResults: collectedToolResults };
};

module.exports = { chat, isQuotaError };
