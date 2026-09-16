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
    sector,
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

Business: ${businessName || 'a small business'}${sector ? ` (sector: ${sector})` : ''}
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
- Tailor suggestions and examples to the business's sector where relevant (tools, channels, workflows typical for that sector).
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

function buildLocalRoadmap(assessmentData) {
  const {
    businessName,
    sector,
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
  // using each question's sector-specific tip (from the DB) rather than a fixed paragraph
  // that's the same regardless of which questions failed.
  function describeCategoryGaps(categoryLabel) {
    const noAnswers = answers.filter((a) => a.category === categoryLabel && a.answer === 0);
    if (noAnswers.length === 0) return null;

    const tips = noAnswers.map((a) => a.tip || a.question);
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
  const sectorPhrase = sector ? ` in the ${sector} sector` : '';

  return {
    intro: `${name}${sectorPhrase} is currently at “${level}” with an overall score of ${totalScore}%. The biggest opportunities are in ${weakLabels || 'a few core digital areas'}. Below is a practical 1–4 week plan you can start immediately.`,
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
