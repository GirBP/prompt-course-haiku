export const meta = {
  name: 'haiku-course-extensions',
  description: 'Extend the prompt-eng course: Haiku-vs-Sonnet comparison, new techniques on Haiku, and Ukrainian-language prompts on Haiku',
  phases: [
    { title: 'Compare', detail: 'Run the same prompts on Sonnet 4.6 to compare with already-captured Haiku outputs' },
    { title: 'NewTech', detail: 'Validate RAG-grounding, long-context, prompt-chaining, nested JSON on Haiku' },
    { title: 'Ukrainian', detail: 'Run Ukrainian-language versions of key prompts on Haiku' },
  ],
}

const RESP = {
  type: 'object', additionalProperties: false,
  properties: { response: { type: 'string', description: 'The assistant reply, verbatim' } },
  required: ['response'],
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
function J(x) { return Array.isArray(x) ? x.join('\n') : x }

// ============ A) Haiku-vs-Sonnet: run these on SONNET (Haiku already captured) ============
const CMP = [
  { id: 'DS1', variant: 'weak', runs: 1, prompt: ['Analyze this dataset and tell me what to do.', '', 'Columns: age, income, churned'] },
  { id: 'DS2', variant: 'weak', runs: 3, prompt: ["Classify the sentiment of this review: 'The dashboard loads slowly but the insights are great.'"] },
  { id: 'DS2', variant: 'strong', runs: 1, prompt: [
    "Classify each review's sentiment. Use exactly one label: POSITIVE, NEGATIVE, or MIXED. Output only the single label word, nothing else.",
    '', "Review: 'Fast and reliable, love it.' -> POSITIVE", "Review: 'Crashes constantly, completely useless.' -> NEGATIVE",
    "Review: 'Great features but terrible support.' -> MIXED", '', "Review: 'The dashboard loads slowly but the insights are great.' ->" ] },
  { id: 'SE1', variant: 'weak', runs: 1, prompt: ['Write a function to validate emails.'] },
  { id: 'SE3', variant: 'weak', runs: 3, prompt: ['Write a commit message for: added retry logic to the API client and fixed a typo in the README.'] },
  { id: 'SE3', variant: 'strong', runs: 1, prompt: [
    'Write ONE commit subject line in Conventional Commits format: type(scope): description. Output only the subject line.',
    '', 'Examples:', '- added pagination to users endpoint -> feat(api): add pagination to users endpoint',
    '- fixed crash on empty input -> fix(parser): handle empty input safely', '- updated install docs -> docs(readme): update installation steps',
    '', 'Now: added retry logic to the API client and fixed a typo in the README ->' ] },
  { id: 'DS4', variant: 'strong', runs: 1, prompt: [
    'Extract metrics from the text into a JSON object with exactly these keys: revenue_musd (number), revenue_growth_yoy_pct (number), churn_rate_pct (number), new_customers (integer). If a value is missing, use null. Output ONLY valid JSON, no markdown, no commentary.',
    '', "Text: 'In Q3 revenue was 4.2M USD, up 12% year over year, churn fell to 3.1%, and we added 540 new customers.'" ] },
  { id: 'SE6', variant: 'weak', runs: 1, prompt: ['What does the pandas.DataFrame.flatten() method do? Explain its parameters and return value.'] },
]
const cmpTasks = []
for (const c of CMP) for (let i = 0; i < (c.runs || 1); i++) cmpTasks.push({ id: c.id, variant: c.variant, run: i + 1, prompt: J(c.prompt) })
const compareThunks = cmpTasks.map(t => () =>
  agent(runner(t.prompt), { model: 'sonnet', phase: 'Compare', label: 'sonnet:' + t.id + ':' + t.variant + '#' + t.run, schema: RESP })
    .then(r => ({ id: t.id, model: 'sonnet', variant: t.variant, run: t.run, prompt: t.prompt, response: r ? r.response : null })))

// ============ B) New techniques on HAIKU ============
const RAG_DOC = 'ACME Cloud pricing: the Starter plan costs 19 USD per month and includes 10 GB of storage and email support. The Pro plan costs 49 USD per month with 100 GB of storage and priority support.'
const RAG_Q = 'Does ACME Cloud offer a free trial, and if so how long is it?'
const LONG = [
  'Onboarding notes for the internal platform team. Read carefully.',
  'The deployment pipeline runs on a self-hosted runner located in the eu-central region.',
  'All services emit structured JSON logs that are shipped to the central log store every 30 seconds.',
  'Feature flags are managed in the config service and cached locally for up to 5 minutes.',
  'The internal API rate limit is 240 requests per minute per service account.',
  'Secrets are rotated quarterly and must never be committed to the repository.',
  'On-call engineers acknowledge pages within 15 minutes during business hours.',
].join('\n')

const newtechThunks = [
  // RAG grounding: answer is NOT in the document
  () => agent(runner('Document:\n' + RAG_DOC + '\n\nQuestion: ' + RAG_Q), { model: 'haiku', phase: 'NewTech', label: 'rag:weak', schema: RESP })
    .then(r => ({ key: 'RAG', variant: 'weak', response: r ? r.response : null })),
  () => agent(runner('Answer ONLY using the document below. If the answer is not stated in the document, reply exactly: NOT IN DOCUMENT. Do not use outside knowledge.\n\nDocument:\n' + RAG_DOC + '\n\nQuestion: ' + RAG_Q), { model: 'haiku', phase: 'NewTech', label: 'rag:strong', schema: RESP })
    .then(r => ({ key: 'RAG', variant: 'strong', response: r ? r.response : null })),
  // Long-context instruction position: instruction BEFORE vs AFTER the text
  () => agent(runner('What is the internal API rate limit? Answer with just the number and unit.\n\n' + LONG), { model: 'haiku', phase: 'NewTech', label: 'longctx:before', schema: RESP })
    .then(r => ({ key: 'LONGCTX', variant: 'instruction_before', response: r ? r.response : null })),
  () => agent(runner(LONG + '\n\nWhat is the internal API rate limit? Answer with just the number and unit.'), { model: 'haiku', phase: 'NewTech', label: 'longctx:after', schema: RESP })
    .then(r => ({ key: 'LONGCTX', variant: 'instruction_after', response: r ? r.response : null })),
  // Nested structured JSON
  () => agent(runner('Extract into a JSON object with this exact shape: {"customer": {"name": string, "tier": string}, "order": {"id": string, "items": [string], "total_usd": number}}. Output only raw JSON starting with the character {.\n\nText: Customer Jane Doe (gold tier) placed order A19 with 2 widgets and 1 gadget, total 57.50 USD.'), { model: 'haiku', phase: 'NewTech', label: 'nestedjson', schema: RESP })
    .then(r => ({ key: 'NESTEDJSON', variant: 'strong', response: r ? r.response : null })),
  // Prompt chaining vs monolithic — the chain is 2 sequential Haiku steps
  () => agent(runner('Here is a messy bug report. Fix it.\n\n"hey the export button on the reports page does nothing in safari, works in chrome, started after the friday deploy, pretty urgent because finance needs the csv"'), { model: 'haiku', phase: 'NewTech', label: 'chain:monolithic', schema: RESP })
    .then(r => ({ key: 'CHAIN', variant: 'monolithic', response: r ? r.response : null })),
  async () => {
    const s1 = await agent(runner('Extract this bug report into JSON with keys: component (string), browser (string), severity (one of low/medium/high), repro (array of short steps), regression_window (string). Output only raw JSON.\n\n"hey the export button on the reports page does nothing in safari, works in chrome, started after the friday deploy, pretty urgent because finance needs the csv"'), { model: 'haiku', phase: 'NewTech', label: 'chain:step1', schema: RESP })
    const s1text = s1 ? s1.response : ''
    const s2 = await agent(runner('Given this structured bug report (JSON), propose a focused 3-step fix-and-verify plan. Be concrete.\n\n' + s1text), { model: 'haiku', phase: 'NewTech', label: 'chain:step2', schema: RESP })
    return { key: 'CHAIN', variant: 'chained', step1: s1text, step2: s2 ? s2.response : null }
  },
]

// ============ C) Ukrainian-language prompts on HAIKU ============
const ukThunks = []
// UK1: classification few-shot in Ukrainian, 3 runs (compare stability vs EN MIXED x3)
const UK_CLS = [
  'Класифікуй тональність відгуку. Використай рівно одну мітку: ПОЗИТИВНА, НЕГАТИВНА або ЗМІШАНА. Виведи лише одне слово-мітку, нічого більше.',
  '', "Відгук: 'Швидко й надійно, обожнюю.' -> ПОЗИТИВНА", "Відгук: 'Постійно вилітає, абсолютно непридатне.' -> НЕГАТИВНА",
  "Відгук: 'Чудові функції, але жахлива підтримка.' -> ЗМІШАНА", '', "Відгук: 'Дашборд вантажиться повільно, але інсайти чудові.' ->",
].join('\n')
for (let i = 0; i < 3; i++) ukThunks.push(() =>
  agent(runner(UK_CLS), { model: 'haiku', phase: 'Ukrainian', label: 'uk:cls#' + (i + 1), schema: RESP })
    .then(r => ({ key: 'UK_CLS', variant: 'few_shot_uk', run: i + 1, response: r ? r.response : null })))
// UK2: role/persona in Ukrainian (compare quality vs EN DS5 strong)
ukThunks.push(() => agent(runner([
  'Ти — senior data scientist, що менторить джуніор-аналітика.',
  'Контекст: колонка income у датасеті відтоку клієнтів має 22% пропущених значень, і пропуски, ймовірно, не випадкові (високозаробітні схильні пропускати це питання).',
  'У 4 коротких пунктах поясни, як обробити ці пропуски. Явно застережи проти наївного підходу з імпутацією середнім і назви одну конкретну кращу техніку. Будь практичним.',
].join('\n')), { model: 'haiku', phase: 'Ukrainian', label: 'uk:role', schema: RESP })
  .then(r => ({ key: 'UK_ROLE', variant: 'strong_uk', response: r ? r.response : null })))
// UK3: bug-finding via CoT in Ukrainian (compare vs EN SE4 strong)
ukThunks.push(() => agent(runner([
  'Проаналізуй цю Python-функцію на наявність багів.',
  'def add_item(item, items=[]):',
  '    items.append(item)',
  '    return items',
  'Міркуй крок за кроком про те, що відбувається, коли її викликають кілька разів без аргументу items. Потім назви головний баг, чому він виникає, і однорядковий фікс.',
].join('\n')), { model: 'haiku', phase: 'Ukrainian', label: 'uk:bug', schema: RESP })
  .then(r => ({ key: 'UK_BUG', variant: 'strong_uk', response: r ? r.response : null })))

log('Compare(sonnet)=' + compareThunks.length + ' NewTech(haiku)=' + newtechThunks.length + ' UK(haiku)=' + ukThunks.length)

const [comparison, newtech, ukrainian] = await Promise.all([
  parallel(compareThunks),
  parallel(newtechThunks),
  parallel(ukThunks),
])

log('Done extensions')
return {
  models: { compare: 'claude-sonnet-4-6 (Haiku side reused from prior run)', validate: 'claude-haiku-4-5' },
  comparison: comparison.filter(Boolean),
  newtech: newtech.filter(Boolean),
  ukrainian: ukrainian.filter(Boolean),
}
