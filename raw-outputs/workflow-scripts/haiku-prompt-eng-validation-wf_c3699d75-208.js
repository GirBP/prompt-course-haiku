export const meta = {
  name: 'haiku-prompt-eng-validation',
  description: 'Validate prompt-engineering techniques (DS + SWE) empirically on Claude Haiku 4.5 and research top learning sites',
  phases: [
    { title: 'Validate', detail: 'Run weak-vs-strong prompt pairs on Claude Haiku 4.5' },
    { title: 'Research', detail: 'Find and verify top prompt-engineering learning sites' },
  ],
}

const RESP_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: { response: { type: 'string', description: 'The assistant reply, verbatim' } },
  required: ['response'],
}

const RESEARCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    sites: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          url: { type: 'string' },
          why: { type: 'string' },
          best_for: { type: 'string' },
          verified_live: { type: 'boolean' },
        },
        required: ['name', 'url', 'why', 'best_for', 'verified_live'],
      },
    },
  },
  required: ['sites'],
}

function runner(promptText) {
  return [
    'You are role-playing as a plain large language model assistant with NO tools and NO internet access.',
    'A user has sent you the single message inside <user_message>. Reply EXACTLY as a helpful AI assistant would in one turn.',
    'Do NOT use any tools. Do NOT mention that this is a simulation or add meta-commentary. Output ONLY the assistant reply to the user.',
    '',
    '<user_message>',
    promptText,
    '</user_message>',
  ].join('\n')
}

const EXPERIMENTS = [
  // ===== DATA SCIENCE =====
  {
    id: 'DS1', domain: 'Data Science', runs: 1,
    technique: 'Clarity and specificity',
    weak: ['Analyze this dataset and tell me what to do.', '', 'Columns: age, income, churned'],
    strong: [
      'I have a customer churn dataset with three columns: age (integer, years), income (float, annual USD), churned (0 or 1, the target).',
      'Goal: predict churn. Churn is imbalanced (about 15% positive).',
      'In exactly 5 numbered bullets, give concrete recommendations:',
      '1) two EDA plots to make first,',
      '2) one feature to engineer from these columns,',
      '3) one suitable baseline model,',
      '4) the single most appropriate evaluation metric given the imbalance,',
      '5) one data-leakage risk to check.',
      'Be specific and concise.',
    ],
  },
  {
    id: 'DS2', domain: 'Data Science', runs: 3,
    technique: 'Few-shot (multishot) for output-format consistency',
    weak: ["Classify the sentiment of this review: 'The dashboard loads slowly but the insights are great.'"],
    strong: [
      "Classify each review's sentiment. Use exactly one label: POSITIVE, NEGATIVE, or MIXED. Output only the single label word, nothing else.",
      '',
      "Review: 'Fast and reliable, love it.' -> POSITIVE",
      "Review: 'Crashes constantly, completely useless.' -> NEGATIVE",
      "Review: 'Great features but terrible support.' -> MIXED",
      '',
      "Review: 'The dashboard loads slowly but the insights are great.' ->",
    ],
  },
  {
    id: 'DS3', domain: 'Data Science', runs: 1,
    technique: 'Chain-of-Thought reasoning',
    weak: ['A fraud-detection model has precision 0.30 and recall 0.90 on data where 2% of transactions are fraud. Is this a good model? Answer only yes or no.'],
    strong: [
      'A fraud-detection model has precision 0.30 and recall 0.90 on data where 2% of transactions are fraud.',
      'Think step by step about the business cost of false positives versus false negatives for fraud detection.',
      'Then give your final verdict (good or not good) in one sentence with justification.',
    ],
  },
  {
    id: 'DS4', domain: 'Data Science', runs: 1,
    technique: 'Structured JSON output with an explicit schema',
    weak: ["Extract the key metrics from this text: 'In Q3 revenue was 4.2M USD, up 12% year over year, churn fell to 3.1%, and we added 540 new customers.'"],
    strong: [
      'Extract metrics from the text into a JSON object with exactly these keys: revenue_musd (number), revenue_growth_yoy_pct (number), churn_rate_pct (number), new_customers (integer). If a value is missing, use null. Output ONLY valid JSON, no markdown, no commentary.',
      '',
      "Text: 'In Q3 revenue was 4.2M USD, up 12% year over year, churn fell to 3.1%, and we added 540 new customers.'",
    ],
  },
  {
    id: 'DS5', domain: 'Data Science', runs: 1,
    technique: 'Role / persona prompting',
    weak: ['How should I handle missing values in the income column?'],
    strong: [
      'You are a senior data scientist mentoring a junior analyst.',
      'Context: the income column in a churn dataset has 22% missing values, and the missingness is likely not random (high earners tend to skip the question).',
      'In 4 short bullets, advise how to handle these missing values. Explicitly warn against the naive mean-imputation approach and name one specific better technique. Be practical.',
    ],
  },
  // ===== SOFTWARE ENGINEERING =====
  {
    id: 'SE1', domain: 'Software Engineering', runs: 1,
    technique: 'Clear specification of requirements',
    weak: ['Write a function to validate emails.'],
    strong: [
      'Write a Python function is_valid_email(s) that returns a bool.',
      "Rules: return True only if s is a string with exactly one '@', a non-empty local part, a domain that contains at least one dot, no whitespace, and a final segment (TLD) of length at least 2.",
      'Do not use a large regex; use simple string operations.',
      'Return False for None or non-string input.',
      'Include a one-line docstring and three example calls in comments.',
      'Output only the code.',
    ],
  },
  {
    id: 'SE2', domain: 'Software Engineering', runs: 1,
    technique: 'XML tags to separate instruction from code',
    weak: ['Review this code and find issues def transfer(a,b,amt): a.bal-=amt b.bal+=amt return True also fix it'],
    strong: [
      '<task>',
      'Review the function inside <code>. List concrete issues in priority order (correctness, validation, concurrency), then provide a corrected version.',
      'Check specifically: missing balance check, no input validation, no error handling.',
      '</task>',
      '',
      '<code>',
      'def transfer(a, b, amt):',
      '    a.bal -= amt',
      '    b.bal += amt',
      '    return True',
      '</code>',
    ],
  },
  {
    id: 'SE3', domain: 'Software Engineering', runs: 3,
    technique: 'Few-shot for a strict format (Conventional Commits)',
    weak: ['Write a commit message for: added retry logic to the API client and fixed a typo in the README.'],
    strong: [
      'Write ONE commit subject line in Conventional Commits format: type(scope): description. Output only the subject line.',
      '',
      'Examples:',
      '- added pagination to users endpoint -> feat(api): add pagination to users endpoint',
      '- fixed crash on empty input -> fix(parser): handle empty input safely',
      '- updated install docs -> docs(readme): update installation steps',
      '',
      'Now: added retry logic to the API client and fixed a typo in the README ->',
    ],
  },
  {
    id: 'SE4', domain: 'Software Engineering', runs: 1,
    technique: 'Bug finding via Chain-of-Thought',
    weak: ['Does this function have a bug? def add_item(item, items=[]): items.append(item); return items'],
    strong: [
      'Analyze this Python function for bugs.',
      'def add_item(item, items=[]):',
      '    items.append(item)',
      '    return items',
      'Reason step by step about what happens when it is called multiple times without the items argument. Then state the single most important bug, why it happens, and the one-line fix.',
    ],
  },
  {
    id: 'SE5', domain: 'Software Engineering', runs: 1,
    technique: 'Forcing output format',
    weak: ['Convert this config to JSON: host=localhost port=5432 ssl=true'],
    strong: [
      "Convert this config into a single JSON object. Output ONLY raw JSON starting with the character '{' - no explanation and no markdown code fences. Use an integer for port and a boolean for ssl.",
      'Config: host=localhost port=5432 ssl=true',
    ],
  },
  {
    id: 'SE6', domain: 'Software Engineering', runs: 1,
    technique: 'Hallucination control (permission to say I do not know)',
    weak: ['What does the pandas.DataFrame.flatten() method do? Explain its parameters and return value.'],
    strong: [
      'What does the pandas.DataFrame.flatten() method do?',
      'If this method does not actually exist in pandas, say so explicitly and do not invent its behavior. Only describe it if you are confident it exists in the pandas API.',
    ],
  },
]

// Flatten into individual Haiku runs
const tasks = []
for (const e of EXPERIMENTS) {
  for (const variant of ['weak', 'strong']) {
    const n = e.runs || 1
    for (let i = 0; i < n; i++) {
      const raw = e[variant]
      const promptText = Array.isArray(raw) ? raw.join('\n') : raw
      tasks.push({ id: e.id, domain: e.domain, technique: e.technique, variant, run: i + 1, prompt: promptText })
    }
  }
}

log('Running ' + tasks.length + ' prompt experiments on Claude Haiku 4.5 + 3 research agents')

const validateThunks = tasks.map(t => () =>
  agent(runner(t.prompt), {
    model: 'haiku',
    phase: 'Validate',
    label: t.id + ':' + t.variant + '#' + t.run,
    schema: RESP_SCHEMA,
  }).then(r => ({ id: t.id, domain: t.domain, technique: t.technique, variant: t.variant, run: t.run, prompt: t.prompt, response: r ? r.response : null }))
)

const RESEARCH = [
  {
    key: 'general',
    prompt: [
      'Use WebSearch and WebFetch. Find the best CURRENT (year 2026) online resources to LEARN prompt engineering, prioritizing resources useful for software developers and for working with Anthropic Claude / Haiku models.',
      'Prefer authoritative, still-maintained resources: official model-provider docs, well-known structured courses, reputable community guides.',
      'For each candidate return: name, url, a one-sentence why, best_for (who/what it suits), and verified_live (true only if you actually fetched the URL and it loads).',
      'Return 4-6 strong candidates.',
    ].join('\n'),
  },
  {
    key: 'datascience',
    prompt: [
      'Use WebSearch and WebFetch. Find the best CURRENT (year 2026) online resources for prompt engineering and using LLMs specifically in DATA SCIENCE / analytics / data workflows (e.g. LLMs for data cleaning, EDA, feature ideas, analysis).',
      'For each candidate return: name, url, a one-sentence why, best_for, and verified_live (true only if you actually fetched the URL and it loads).',
      'Return 3-5 candidates.',
    ].join('\n'),
  },
  {
    key: 'swe',
    prompt: [
      'Use WebSearch and WebFetch. Find the best CURRENT (year 2026) online resources for prompt engineering specifically for SOFTWARE ENGINEERING / coding with LLMs (writing code, code review, debugging, agentic coding).',
      'For each candidate return: name, url, a one-sentence why, best_for, and verified_live (true only if you actually fetched the URL and it loads).',
      'Return 3-5 candidates.',
    ].join('\n'),
  },
]

const researchThunks = RESEARCH.map(q => () =>
  agent(q.prompt, {
    agentType: 'general-purpose',
    phase: 'Research',
    label: 'research:' + q.key,
    schema: RESEARCH_SCHEMA,
  }).then(r => ({ key: q.key, sites: r ? r.sites : [] }))
)

const [results, research] = await Promise.all([
  parallel(validateThunks),
  parallel(researchThunks),
])

log('Done: ' + results.filter(Boolean).length + ' Haiku runs captured, ' + research.filter(Boolean).length + ' research buckets')

return {
  haikuModel: 'claude-haiku-4-5 (validated via Agent harness; no raw API key was available)',
  results: results.filter(Boolean),
  research: research.filter(Boolean),
}
