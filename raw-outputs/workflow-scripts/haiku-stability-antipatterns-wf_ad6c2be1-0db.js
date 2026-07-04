export const meta = {
  name: 'haiku-stability-antipatterns',
  description: 'N=5 format-reliability validation, prompt antipatterns, and URL re-verification — all via subagents on Haiku 4.5',
  phases: [
    { title: 'Stability', detail: 'Run key strong prompts 5x on Haiku to measure format reliability' },
    { title: 'Antipatterns', detail: 'Run deliberately bad prompts + fixes on Haiku' },
    { title: 'URLverify', detail: 'WebFetch each top learning URL to confirm it is live' },
  ],
}

const RESP = {
  type: 'object', additionalProperties: false,
  properties: { response: { type: 'string' } }, required: ['response'],
}
const URL_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { results: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    properties: { url: { type: 'string' }, live: { type: 'boolean' }, status: { type: 'string' }, note: { type: 'string' } },
    required: ['url', 'live', 'status', 'note'] } } },
  required: ['results'],
}

function runner(p) {
  return [
    'You are role-playing as a plain large language model assistant with NO tools and NO internet access.',
    'A user has sent you the single message inside <user_message>. Reply EXACTLY as a helpful AI assistant would in one turn.',
    'Do NOT use any tools. Do NOT mention that this is a simulation or add meta-commentary. Output ONLY the assistant reply to the user.',
    '', '<user_message>', p, '</user_message>',
  ].join('\n')
}
function J(x) { return Array.isArray(x) ? x.join('\n') : x }

const RAG_DOC = 'ACME Cloud pricing: the Starter plan costs 19 USD per month and includes 10 GB of storage and email support. The Pro plan costs 49 USD per month with 100 GB of storage and priority support.'
const RAG_Q = 'Does ACME Cloud offer a free trial, and if so how long is it?'

// ===== 1) STABILITY: each prompt x5 on Haiku =====
const STAB = [
  { id: 'DS2_strong', expect: 'label MIXED', prompt: [
    "Classify each review's sentiment. Use exactly one label: POSITIVE, NEGATIVE, or MIXED. Output only the single label word, nothing else.",
    '', "Review: 'Fast and reliable, love it.' -> POSITIVE", "Review: 'Crashes constantly, completely useless.' -> NEGATIVE",
    "Review: 'Great features but terrible support.' -> MIXED", '', "Review: 'The dashboard loads slowly but the insights are great.' ->" ] },
  { id: 'SE3_strong', expect: 'one-line conventional commit', prompt: [
    'Write ONE commit subject line in Conventional Commits format: type(scope): description. Output only the subject line.',
    '', 'Examples:', '- added pagination to users endpoint -> feat(api): add pagination to users endpoint',
    '- fixed crash on empty input -> fix(parser): handle empty input safely', '- updated install docs -> docs(readme): update installation steps',
    '', 'Now: added retry logic to the API client and fixed a typo in the README ->' ] },
  { id: 'DS4_strong', expect: 'bare JSON, no markdown', prompt: [
    'Extract metrics from the text into a JSON object with exactly these keys: revenue_musd (number), revenue_growth_yoy_pct (number), churn_rate_pct (number), new_customers (integer). If a value is missing, use null. Output ONLY valid JSON, no markdown, no commentary.',
    '', "Text: 'In Q3 revenue was 4.2M USD, up 12% year over year, churn fell to 3.1%, and we added 540 new customers.'" ] },
  { id: 'SE5_strong', expect: 'bare JSON via first-char anchor', prompt: [
    "Convert this config into a single JSON object. Output ONLY raw JSON starting with the character '{' - no explanation and no markdown code fences. Use an integer for port and a boolean for ssl.",
    'Config: host=localhost port=5432 ssl=true' ] },
  { id: 'RAG_strong', expect: 'exactly NOT IN DOCUMENT', prompt: [
    'Answer ONLY using the document below. If the answer is not stated in the document, reply exactly: NOT IN DOCUMENT. Do not use outside knowledge.',
    '', 'Document:', RAG_DOC, '', 'Question: ' + RAG_Q ] },
  { id: 'NESTED_strong', expect: 'nested JSON, items array', prompt: [
    'Extract into a JSON object with this exact shape: {"customer": {"name": string, "tier": string}, "order": {"id": string, "items": [string], "total_usd": number}}. Output only raw JSON starting with the character {.',
    '', 'Text: Customer Jane Doe (gold tier) placed order A19 with 2 widgets and 1 gadget, total 57.50 USD.' ] },
  { id: 'DS2_weak', expect: 'contrast: unstable', prompt: ["Classify the sentiment of this review: 'The dashboard loads slowly but the insights are great.'"] },
  { id: 'SE3_weak', expect: 'contrast: unstable', prompt: ['Write a commit message for: added retry logic to the API client and fixed a typo in the README.'] },
]
const stabThunks = []
for (const s of STAB) for (let i = 0; i < 5; i++) stabThunks.push(() =>
  agent(runner(J(s.prompt)), { model: 'haiku', phase: 'Stability', label: s.id + '#' + (i + 1), schema: RESP })
    .then(r => ({ id: s.id, expect: s.expect, run: i + 1, response: r ? r.response : null })))

// ===== 2) ANTIPATTERNS: bad vs fixed on Haiku =====
const AP = [
  { id: 'AP1_contradictory',
    bad: 'Write a comprehensive, in-depth guide to database indexing covering all index types, trade-offs, and examples. Limit your entire answer to a single short sentence.',
    fixed: 'In one sentence, state the single most important thing a backend developer should know about database indexing.' },
  { id: 'AP2_negation_only',
    bad: "Explain gradient descent. Don't be vague. Don't use jargon. Don't write too much. Don't oversimplify. Don't be boring.",
    fixed: 'Explain gradient descent in exactly 3 sentences for a junior developer, using one everyday analogy. Avoid math notation.' },
  { id: 'AP3_overloaded',
    bad: 'Build me a Python web scraper, explain async/await, recommend the best database, write unit tests, dockerize it, and summarize REST vs GraphQL.',
    fixed: 'I am building a Python web scraper. For now only this: write a function fetch_html(url) using requests that returns the page text, retries up to 3 times on failure, and raises on a non-200 status. Output only the code.' },
  { id: 'AP4_leading_false_premise',
    bad: 'Explain why Python is always faster than C++ for numerical computing.',
    fixed: 'Compare Python and C++ performance for numerical computing. If the premise that one is "always faster" is wrong, correct it, and explain when each tends to be faster.' },
]
const apThunks = []
for (const a of AP) {
  apThunks.push(() => agent(runner(a.bad), { model: 'haiku', phase: 'Antipatterns', label: a.id + ':bad', schema: RESP })
    .then(r => ({ id: a.id, kind: 'bad', prompt: a.bad, response: r ? r.response : null })))
  apThunks.push(() => agent(runner(a.fixed), { model: 'haiku', phase: 'Antipatterns', label: a.id + ':fixed', schema: RESP })
    .then(r => ({ id: a.id, kind: 'fixed', prompt: a.fixed, response: r ? r.response : null })))
}

// ===== 3) URL re-verification via WebFetch =====
const URLS = [
  'https://github.com/anthropics/prompt-eng-interactive-tutorial',
  'https://www.promptingguide.ai/',
  'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices',
  'https://code.claude.com/docs/en/best-practices',
  'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents',
  'https://developers.openai.com/api/docs/guides/prompt-engineering',
]
const urlThunk = () => agent(
  'Use WebFetch on each of these URLs and report whether each loads (is live) right now. For each, give: url, live (true/false), status (e.g. "200 OK" or short error), and a 6-10 word note on what the page actually is (to confirm it is the right resource, not a redirect/404). Be factual; if a fetch fails, live=false.\n\nURLs:\n' + URLS.map((u, i) => (i + 1) + '. ' + u).join('\n'),
  { agentType: 'general-purpose', phase: 'URLverify', label: 'urlcheck', schema: URL_SCHEMA })

log('Stability=' + stabThunks.length + ' Antipatterns=' + apThunks.length + ' URLcheck=1')

const [stability, antipatterns, urlres] = await Promise.all([
  parallel(stabThunks),
  parallel(apThunks),
  urlThunk(),
])

log('Done stability/antipatterns/urls')
return {
  model: 'claude-haiku-4-5',
  stability: stability.filter(Boolean),
  antipatterns: antipatterns.filter(Boolean),
  urls: urlres ? urlres.results : [],
}
