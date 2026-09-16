/**
 * AI roadmap generation — isolated so the provider can be swapped later.
 * Default: Anthropic Claude Messages API.
 * Falls back to a local rule-based roadmap if the API key is missing or the call fails,
 * so the MVP can still be demoed offline.
 */
const { attachResources } = require('./resourceLinks');

async function generateRoadmap(assessmentData) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const hasRealKey =
    apiKey &&
    apiKey.trim() &&
    apiKey !== 'your_anthropic_api_key' &&
    !apiKey.includes('your_');

  if (!hasRealKey) {
    console.warn('ANTHROPIC_API_KEY not set — using local roadmap fallback');
    return attachResources(buildLocalRoadmap(assessmentData));
  }

  try {
    const roadmap = await generateWithAnthropic(assessmentData, apiKey.trim());
    return attachResources(roadmap);
  } catch (err) {
    console.error('Anthropic roadmap failed, using local fallback:', err.message);
    return attachResources(buildLocalRoadmap(assessmentData));
  }
}

async function generateWithAnthropic(assessmentData, apiKey) {
  const {
    businessName,
    totalScore,
    level,
    categories,
    answers,
  } = assessmentData;

  const weakCategories = (categories || [])
    .filter((c) => Number(c.score) < 67)
    .sort((a, b) => Number(a.score) - Number(b.score))
    .map((c) => `${c.label} (${c.score}%)`)
    .join(', ');

  const categorySummary = (categories || [])
    .map((c) => `- ${c.label}: ${c.score}% (${c.yesCount}/${c.questionCount} yes)`)
    .join('\n');

  const answerLines = (answers || [])
    .map((a) => `- [${a.category}] ${a.question}: ${a.answer === 1 ? 'Yes' : 'No'}`)
    .join('\n');

  const prompt = `You are a practical digital advisor for small businesses. Avoid generic fluff.

Business: ${businessName || 'a small business'}
Overall digital maturity: ${totalScore}% — level "${level}"
Weakest / focus areas: ${weakCategories || 'none clearly weak'}

Category scores:
${categorySummary}

Assessment answers:
${answerLines}

Write a personalized action roadmap as JSON only (no markdown fences), with this exact shape:
{
  "intro": "2-3 sentences referencing their specific weak areas and overall level",
  "actions": [
    {
      "title": "short action title",
      "priority": 1,
      "timeframe": "1-2 weeks",
      "category": "matching category label",
      "description": "concrete steps they can do this week/month"
    }
  ]
}

Rules:
- Include 3 to 5 prioritized actions (priority 1 = highest).
- Each action must be specific and doable within 1-4 weeks.
- Prioritize weak categories first.
- Reference their actual No answers where useful.
- Every action's description must name at least one specific "No" answer from THIS business's
  assessment and address it directly - do not write an action that could apply to any business
  regardless of their answers.
- Do not invent tools they must buy unless free/low-cost options exist.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  return parseRoadmapContent(text);
}

// Per-question, specific guidance - keyed by the exact question text from schema.sql.
// This is what makes the local (non-AI) roadmap genuinely reflect the recorded answers
// rather than giving the same paragraph to every business in a category regardless of
// which specific questions were answered "No".
const QUESTION_TIPS = {
  'Do you have a mobile-friendly website that clearly explains what you offer?':
    'Check your site on your own phone. If text is tiny or buttons are hard to tap, switch to a mobile-friendly template and rewrite the homepage to say what you sell in one sentence.',
  'Can customers find your business on Google Maps or a local directory listing?':
    'Claim your Google Business Profile (free), add your address, hours, and photos, and ask 3 recent customers for a review to help it show up in local search.',
  'Do you update your online profiles (website or social) at least monthly?':
    'Put a recurring 15-minute calendar reminder once a month to post one update, photo, or offer - consistency matters more than frequency.',
  'Can customers pay you online (card, PayPal, Stripe, or similar)?':
    'Sign up for a payment link tool (Stripe, PayPal, or Square) - most let you start accepting card payments same-day with no hardware.',
  'Do you send digital invoices or receipts instead of paper-only?':
    'Turn on digital invoicing in whatever payment tool you use, and send your next 5 invoices by email instead of paper.',
  'Do you reconcile payments digitally (accounting software or spreadsheet)?':
    'Start with a simple shared spreadsheet logging every payment in and out weekly - a full accounting tool can come later.',
  'Do you use email or SMS to stay in touch with customers?':
    'Collect emails or phone numbers at checkout (with permission) and send one short update or offer this month to test the channel.',
  'Do you run any paid digital ads (Google, Meta, or similar)?':
    'Start with a $5-10/day test on Meta or Google ads targeting your local area - most platforms let you pause anytime.',
  'Do you collect customer reviews online and respond to them?':
    'Ask your next 3 happy customers directly for a review, and reply to any existing reviews (good or bad) this week.',
  'Do you use shared digital tools for scheduling, bookings, or task tracking?':
    'Pick one free shared tool (Google Calendar, Trello, or similar) for bookings or tasks and move everything out of texts/paper this week.',
  'Can your team access key business files from anywhere (cloud storage)?':
    'Move your most-used files into a shared cloud folder (Google Drive or similar) and check everyone on the team has access from their phone.',
  'Do you automate any routine tasks (reminders, order confirmations, etc.)?':
    'Turn on automatic reminders or confirmations in whatever booking/payment tool you already use - most have this built in but switched off.',
  'Do you track basic sales or customer metrics in a spreadsheet or dashboard?':
    'Create one spreadsheet tracking weekly sales, new customers, and repeat customers - just 3 numbers is enough to start.',
  'Do you review performance data at least monthly to guide decisions?':
    'Block 20 minutes every Friday to look at last week\'s numbers and note one decision you will make because of them.',
  'Do you store customer contact details securely in a digital system (CRM or list)?':
    'Move customer contacts out of a notebook or scattered texts into one simple digital list or a free CRM tool.',
};

function buildLocalRoadmap(assessmentData) {
  const {
    businessName,
    totalScore,
    level,
    categories = [],
    answers = [],
  } = assessmentData;

  const sorted = [...categories].sort((a, b) => Number(a.score) - Number(b.score));
  const weak = sorted.filter((c) => Number(c.score) < 67);
  const focus = (weak.length ? weak : sorted).slice(0, 4);

  const playbooks = {
    'Online Presence': { title: 'Get findable online this week', timeframe: '1-2 weeks' },
    'Digital Payments': { title: 'Turn on a simple digital payment option', timeframe: '1-2 weeks' },
    Marketing: { title: 'Start a basic customer follow-up loop', timeframe: '2 weeks' },
    Operations: { title: 'Move one routine process into a shared digital tool', timeframe: '1-3 weeks' },
    'Data Use': { title: 'Track three numbers every week', timeframe: '1-2 weeks' },
  };

  // Builds a description entirely from THIS business's actual "No" answers in a category,
  // rather than a fixed paragraph that's the same regardless of which questions failed.
  function describeCategoryGaps(categoryLabel) {
    const noAnswers = answers.filter((a) => a.category === categoryLabel && a.answer === 0);
    if (noAnswers.length === 0) return null;

    const tips = noAnswers.map((a) => QUESTION_TIPS[a.question] || a.question);
    if (tips.length === 1) return tips[0];
    return tips.map((t, i) => `${i + 1}) ${t}`).join(' ');
  }

  const actions = focus.map((cat, i) => {
    const book = playbooks[cat.label] || { title: `Improve ${cat.label}`, timeframe: '2 weeks' };
    const gapDescription = describeCategoryGaps(cat.label);

    return {
      title: book.title,
      priority: i + 1,
      timeframe: book.timeframe,
      category: cat.label,
      description:
        gapDescription ||
        `Your ${cat.label} score is ${cat.score}%. Pick one concrete improvement from that area and finish it within two weeks.`,
    };
  });

  while (actions.length < 3 && sorted[actions.length]) {
    const cat = sorted[actions.length];
    const book = playbooks[cat.label];
    if (book && !actions.some((a) => a.category === cat.label)) {
      actions.push({
        title: book.title,
        priority: actions.length + 1,
        timeframe: book.timeframe,
        category: cat.label,
        description:
          describeCategoryGaps(cat.label) ||
          `Your ${cat.label} score is ${cat.score}%. Pick one concrete improvement from that area and finish it within two weeks.`,
      });
    } else {
      break;
    }
  }

  const weakLabels = focus.map((c) => `${c.label} (${c.score}%)`).join(', ');
  const name = businessName || 'Your business';

  return {
    intro: `${name} is currently at “${level}” with an overall score of ${totalScore}%. The biggest opportunities are in ${weakLabels || 'a few core digital areas'}. Below is a practical 1–4 week plan you can start immediately.`,
    actions: actions.slice(0, 5),
  };
}

function parseRoadmapContent(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed.intro || !Array.isArray(parsed.actions)) {
      throw new Error('Missing intro or actions');
    }
    return {
      intro: String(parsed.intro),
      actions: parsed.actions.slice(0, 5).map((a, i) => ({
        title: String(a.title || `Action ${i + 1}`),
        priority: Number(a.priority) || i + 1,
        timeframe: String(a.timeframe || '1-2 weeks'),
        category: String(a.category || ''),
        description: String(a.description || ''),
      })),
    };
  } catch {
    return {
      intro: cleaned.slice(0, 500) || 'Here is a starter digital action plan based on your assessment.',
      actions: [
        {
          title: 'Review your weakest digital areas',
          priority: 1,
          timeframe: '1 week',
          category: '',
          description: cleaned.slice(0, 800) || 'Focus on the categories with the lowest scores and pick one concrete improvement this week.',
        },
      ],
    };
  }
}

module.exports = { generateRoadmap };
