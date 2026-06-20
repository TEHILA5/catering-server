/**
 * Manual integration test for agent order flow.
 * Usage: node scripts/test-agent-order-flow.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const agentService = require('../src/agent/agent.service');

const ORDER_MSG = 'חבילה עסקית צהריים, 30 אורחים, 17/09/2028, בני ברק';
const FOLLOW_UP = 'תיצור לי הזמנה אז';

const toolNamesFromHistory = (historyTurns) =>
  historyTurns.flatMap((t) =>
    (t.parts || [])
      .filter((p) => p.functionCall?.name)
      .map((p) => p.functionCall.name)
  );

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY');
    process.exit(1);
  }

  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  }

  const testUser = await User.findOne({ role: 'customer' }).select('_id').lean();
  if (!testUser) {
    console.error('No customer user in DB – register a user first');
    process.exit(1);
  }

  const authContext = {
    isAuthenticated: true,
    user: { id: String(testUser._id) },
  };

  console.log('\n=== Turn 1: full order details (authenticated) ===');
  const turn1 = await agentService.chat(ORDER_MSG, {
    ...authContext,
    history: [],
  });

  console.log('Reply:', turn1.reply?.slice(0, 200));
  console.log('Tool results:', turn1.toolResults.map((t) => t.name));
  console.log('Tools in historyTurns:', toolNamesFromHistory(turn1.historyTurns));

  const showedPackages = turn1.toolResults.some((t) => t.name === 'getPackages');
  const attemptedOrder = turn1.historyTurns.some((t) =>
    (t.parts || []).some((p) => p.functionCall?.name === 'createOrder')
  );

  console.log('Showed package cards:', showedPackages);
  console.log('Attempted createOrder:', attemptedOrder);

  console.log('\n=== Turn 2: follow-up with preserved history ===');
  const turn2 = await agentService.chat(FOLLOW_UP, {
    ...authContext,
    history: turn1.historyTurns,
  });

  console.log('Reply:', turn2.reply?.slice(0, 200));
  console.log('Tool results:', turn2.toolResults.map((t) => t.name));
  console.log('Tools in historyTurns:', toolNamesFromHistory(turn2.historyTurns));

  const recalledGetPackages = turn2.historyTurns.some((t) =>
    (t.parts || []).some((p) => p.functionCall?.name === 'getPackages')
  );

  console.log('Called getPackages again on follow-up:', recalledGetPackages);

  if (recalledGetPackages) {
    console.error('\nFAIL: getPackages was called again despite history');
    process.exitCode = 1;
  } else if (!attemptedOrder && !turn2.historyTurns.some((t) =>
    (t.parts || []).some((p) => p.functionCall?.name === 'createOrder')
  )) {
    console.error('\nFAIL: createOrder was not attempted');
    process.exitCode = 1;
  } else {
    console.log('\nPASS: no getPackages loop on follow-up; order flow progressed');
  }

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
