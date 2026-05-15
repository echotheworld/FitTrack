/**
 * FitTrack Coach Engine — Phase 1 (Hardcoded AI Personality) + Phase 2 (Gemini)
 * 
 * Architecture:
 *  1. Context Builder  → reads live data → builds mood/state object
 *  2. Response Selector → maps state → message pool (randomised)
 *  3. Gemini Slot       → "Ask Coach" replaces hardcoded chat later
 */

// ─── Context Builder ────────────────────────────────────────────────────────────
export const buildContext = ({ dailyStats, weeklyStats, goals, streak, firstName }) => {
  const stepPct = goals.dailyStepGoal > 0 ? dailyStats.steps / goals.dailyStepGoal : 0;
  const weeklyPct = goals.weeklyDistanceGoal > 0
    ? weeklyStats.distance / goals.weeklyDistanceGoal : 0;

  return {
    firstName,
    steps: dailyStats.steps,
    stepPct: Math.min(stepPct, 1),
    weeklyPct: Math.min(weeklyPct, 1),
    distance: weeklyStats.distance,
    calories: dailyStats.calories,
    duration: dailyStats.duration,
    streak,
    mood: stepPct >= 1 ? 'goal_achieved'
      : stepPct >= 0.8 ? 'near_goal'
      : stepPct >= 0.4 ? 'active'
      : stepPct > 0 ? 'slow_start'
      : 'no_activity',
  };
};

// ─── Response Selector ─────────────────────────────────────────────────────────
import { intentionalDataset } from './intentionalDataset';
import { localIntents } from './localIntents';

export const getCoachMessage = (ctx) => {
  const firstName = ctx.firstName || 'Athlete';
  const steps = ctx.steps || 0;

  const greetings = {
    goal_achieved: [
      `🏆 Goal smashed, ${firstName}! You're unstoppable today.`,
      `Incredible discipline, ${firstName}! You've already hit your target. 🚀`,
      `Elite performance today! You've conquered your goals. 💎`,
      `You're on fire! 🔥 Target reached. Time for some active recovery?`,
      `Machine status: ACTIVE. 🤖 Great job on hitting that goal!`,
      `Victory is yours! 🥇 Another goal in the books. How do you feel?`,
      `You make this look easy, ${firstName}! Goal accomplished. 🎯`,
      `Pure dedication. 🎖️ You've smashed your target for the day!`
    ],
    near_goal: [
      `🚀 Almost there! Just a final push to hit your target.`,
      `The finish line is in sight, ${firstName}! Just a few more steps. 🏁`,
      `So close you can taste it! 👅 Let's get that goal.`,
      `You're in the home stretch! 🏃 Keep that momentum going.`,
      `Just a tiny bit more, ${firstName}. You've got this! 💪`,
      `90% there! Don't stop now, the goal is right around the corner. 🏔️`,
      `You're crushing it! One last push to reach the summit. ⛰️`,
      `Almost at the target! Let's finish today strong. ⚡`
    ],
    active: [
      `🏃 Looking good, ${firstName}! You're at ${steps.toLocaleString()} steps and building.`,
      `Nice rhythm today! Let's keep those legs moving. 👣`,
      `Building solid momentum! 📈 You're doing great.`,
      `I see that progress! ${steps.toLocaleString()} steps is a great foundation. 👟`,
      `Keep that engine warm, ${firstName}! You're on the right track. 🚂`,
      `Every step counts. You're building a healthier you! 🌟`,
      `Stay consistent! You're making great progress so far. 🛡️`,
      `I love the energy! Let's see how many more steps we can get. 🌪️`
    ],
    slow_start: [
      `😴 Time to wake up, ${firstName}! Even a 5-minute walk changes everything.`,
      `Let's get moving! 👟 Small steps lead to big changes.`,
      `A bit of a slow start, but the day is young! Let's hit the pavement. 🛌`,
      `Time to shake off the rust! Just a quick 10-minute walk? 🚿`,
      `Lace up, ${firstName}! Your future self will thank you for moving now. 👟`,
      `Zero is just a starting point. Let's get those first few hundred steps! 😤`,
      `The hardest part is the first step. Let's take it together! 🤝`,
      `Time to trade the couch for the sidewalk. Let's go! 🚀`
    ]
  };

  const pool = greetings[ctx.mood] || greetings.active;
  return pool[Math.floor(Math.random() * pool.length)];
};

// ─── Local AI Brain (Intentional Dataset Mode) ───────────────────────────────

export const getLocalResponse = (userMessage, ctx) => {
  const msg = userMessage.toLowerCase();
  const firstName = ctx.firstName || 'Athlete';
  const steps = ctx.steps || 0;

  // 1. DATA-SPECIFIC QUESTIONS (Highest Priority)
  if (msg.includes('step') || msg.includes('how many')) {
    return `You've taken ${steps.toLocaleString()} steps today, ${firstName}. That's ${Math.round(ctx.stepPct * 100)}% of your goal! 👣`;
  }

  if (msg.includes('streak')) {
    return ctx.streak > 0 
      ? `You're on a solid ${ctx.streak}-day streak! Let's keep the chain going today ⚡`
      : `Let's start a new streak today. Your first step is the most important one!`;
  }

  // 2. INTENTIONAL CATEGORY MATCHING
  const matchedIntent = localIntents.find(intent => 
    intent.keywords.some(kw => msg.includes(kw)) || (intent.intent === 'wellness' && msg.includes('healthy'))
  );

  if (matchedIntent) {
    const category = matchedIntent.intent;
    const pool = intentionalDataset[category] || [];
    
    if (pool.length > 0) {
      const response = pool[Math.floor(Math.random() * pool.length)];
      
      // PERSONALITY LAYER: Massively Expanded Randomized Prefixes (20+ variations)
      const prefixPools = {
        goal_achieved: [
          `🏆 Goal smashed today, ${firstName}! Since you're crushing it, here's some expert info: `,
          `Incredible work on those steps, ${firstName}. You're an elite machine. Check this out: `,
          `You've already hit your target! 🚀 While you recover, here's some research on ${category}: `,
          `Victory lap time, ${firstName}! 🥇 You've earned this extra bit of fitness knowledge: `,
          `Goal reached! You're making this look easy, ${firstName}. On the subject of ${category}: `,
          `Elite status achieved today! 💎 While you're on top, did you know this about ${category}? `,
          `Target hit! 🎯 You're building an unstoppable habit, ${firstName}. Check this tip out: `,
          `Mission accomplished! 🎖️ Since you've got the momentum, let's look at ${category}: `
        ],
        active: [
          `Great progress today, ${firstName}. You're at ${steps.toLocaleString()} steps and climbing! `,
          `Solid rhythm, ${firstName}. Since you're moving, I thought you'd like to know: `,
          `Building momentum! 📈 You're doing great. On the topic of ${category}: `,
          `I see you're putting in the work, ${firstName}! 👣 Here's a tip to keep you going: `,
          `You're at ${steps.toLocaleString()} steps already! 🚀 Keep that engine warm. Did you know: `,
          `Energy levels looking good, ${firstName}! ⚡ While you're active, consider this: `,
          `Making every step count! 👟 You're ${Math.round(ctx.stepPct * 100)}% to your goal. On ${category}: `,
          `Strong pace today, ${firstName}. 🏃 Since you're in the zone, here's some expert advice: `,
          `Keep pushing, athlete! 😤 You're building a healthier you with every step. About ${category}: `,
          `I love the consistency, ${firstName}! 🛡️ Here is some research to fuel your next walk: `,
          `You're over 1,000 steps and looking strong! 📈 Stay focused. On the subject of ${category}: `,
          `Moving with purpose today! 🌟 ${firstName}, here is an expert tip for you: `,
          `The momentum is real! 🌪️ Keep those legs moving. Regarding ${category}: `,
          `Your heart will thank you for those ${steps.toLocaleString()} steps! ❤️ Check this out: `,
          `Step by step, you're getting there. 👣 Since you're on track, here's some info on ${category}: `,
          `You're crushing the daily grind! ⚒️ Keep it up, ${firstName}. On the topic of ${category}: `,
          `Halfway is just around the corner! 🏔️ Stay motivated with this tip on ${category}: `,
          `Feel that post-walk glow? ✨ You're doing incredible. Here is a thought on ${category}: `,
          `Consistency beats intensity every time! 🔨 Great job today. About ${category}: `,
          `You're a movement machine! 🤖 Keep those gears turning. Here's a ${category} tip: `
        ],
        default: [
          `Hey ${firstName} 👋 Ready to start making some moves? On ${category}: `,
          `Looking at your progress, ${firstName}... Let's get that number up! Meanwhile, about ${category}: `,
          `Interesting question! 💡 Here's what I found for you regarding ${category}: `,
          `I've got some expert info for you, ${firstName}. Regarding ${category}: `,
          `Let's talk about ${category} for a second... 🗣️ `,
          `Always good to learn more while you move! 📚 On ${category}: `,
          `Knowledge is power, but action is key! 🔑 While we prepare to move, here's some ${category} info: `,
          `Hey ${firstName}! 👟 Just checked my dataset for you. On the subject of ${category}: `
        ]
      };

      const prefixType = ctx.mood === 'goal_achieved' ? 'goal_achieved' : (steps > 1000 ? 'active' : 'default');
      const prefixes = prefixPools[prefixType];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      
      return `${prefix}${response}`;
    }
  }

  // 3. FALLBACK SEARCH (Deep Scan)
  const words = msg.split(' ').filter(w => w.length > 3);
  for (const word of words) {
    // Search ALL categories in the intentional dataset
    for (const cat in intentionalDataset) {
      const matches = intentionalDataset[cat].filter(text => text.toLowerCase().includes(word));
      if (matches.length > 0) {
        return `Good question, ${firstName}. Here is some research I found on that: ${matches[Math.floor(Math.random() * matches.length)]}`;
      }
    }
  }

  // 4. FALLBACKS / MOOD
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
    return `Hey ${firstName}! Ready to make some progress? You're at ${steps.toLocaleString()} steps so far 👣`;
  }

  const pools = {
    goal_achieved: [
      "🏆 Goal smashed! You're an elite machine today.",
      "💪 Pure discipline. You've earned a recovery night.",
      "Incredible work! You've conquered the day. 👑",
      "You're making this look easy! Goal accomplished. 🎯",
      "Target hit! 🎯 You're building an unstoppable habit.",
      "Victory is yours! 🥇 Another goal in the books.",
      "You're on fire! 🔥 Target reached. Time for some rest?",
      "Elite performance! 💎 You've conquered your goals today."
    ],
    near_goal: [
      "🚀 So close! A final push and you're done.",
      "💡 Finish line is right there. Go get it!",
      "The finish line is in sight! Just a few more steps. 🏁",
      "So close you can taste it! 👅 Let's get that goal.",
      "You're in the home stretch! 🏃 Keep that momentum going.",
      "Just a tiny bit more! You've got this. 💪",
      "90% there! Don't stop now, the goal is right around the corner. 🏔️",
      "You're crushing it! One last push to reach the summit. ⛰️"
    ],
    active: [
      "🏃 Good rhythm today. Stay consistent!",
      "📈 Momentum is building. Keep the engine warm.",
      "Nice rhythm today! Let's keep those legs moving. 👣",
      "I see that progress! You're building a healthier you. 🌟",
      "Keep that engine warm! You're on the right track. 🚂",
      "Every step counts. You're doing great! 👣",
      "Stay consistent! You're making great progress so far. 🛡️",
      "I love the energy! Let's see how many more steps we can get. 🌪️"
    ],
    slow_start: [
      "😴 A bit of a slow start, but the day is young!",
      "👟 Lace up! Even a 10-minute walk changes everything.",
      "Time to shake off the rust! Just a quick walk? 🚿",
      "Let's get moving! 👟 Small steps lead to big changes.",
      "A bit of a slow start, but the day is young! Let's hit the pavement. 🛌",
      "Lace up! Your future self will thank you for moving now. 👟",
      "The hardest part is the first step. Let's take it together! 🤝",
      "Time to trade the couch for the sidewalk. Let's go! 🚀",
      "Waking up the metabolism! Let's get those first few hundred steps. ⚡",
      "Slow and steady wins the race, but you've got to start! 🐢💨"
    ],
    no_activity: [
      "😤 Time to get off zero! Let's get those first steps.",
      "🛌 Rest is over—time to move, athlete!",
      "Zero is just a starting point. Let's get moving! 👣",
      "The sidewalk is calling your name! 📞👟",
      "Time to break the silence! Let's log some steps. 🤫👣",
      "Your shoes are feeling lonely. Let's take them for a spin! 👟🌪️",
      "Don't let the day pass you by! Let's get at least 500 steps. ⏳",
      "Every journey starts with a single step. Let's take yours now! 🗺️"
    ]
  };

  const pool = pools[ctx.mood] || pools.active;
  return pool[Math.floor(Math.random() * pool.length)];
};

// ─── Main Interface ───────────────────────────────────────────────────────────
// We'll keep this exported but the Screen will now prioritize getLocalResponse
export const askGemini = async (userMessage, ctx, chatHistory = []) => {
  // Always throw now to trigger the local fallback as requested
  throw new Error("Local mode active");
};
