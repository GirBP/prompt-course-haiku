export const meta = {
  name: 'course-liveness-audit',
  description: 'Multi-agent audit of the prompt-eng course APP: architecture, functionality, reliability, liveness — with an adversarial completeness critic. Runs on Sonnet for resilience.',
  phases: [
    { title: 'Analyze', detail: '4 agents, one per dimension, grounding every finding in file evidence', model: 'sonnet' },
    { title: 'Verify', detail: 'completeness critic checks overclaims and finds the weakest part', model: 'sonnet' },
  ],
}

const DIM_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    dimension: { type: 'string' },
    score_1to5: { type: 'number' },
    one_line_verdict: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    weaknesses: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      properties: {
        point: { type: 'string' },
        severity: { type: 'string', enum: ['high', 'medium', 'low'] },
        evidence: { type: 'string', description: 'concrete file name/line or quote' },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      }, required: ['point', 'severity', 'evidence', 'confidence'] } },
    whats_left: { type: 'array', items: { type: 'string' } },
    could_not_verify: { type: 'array', items: { type: 'string' } },
  },
  required: ['dimension', 'score_1to5', 'one_line_verdict', 'strengths', 'weaknesses', 'whats_left', 'could_not_verify'],
}

const CRITIC_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    missed: { type: 'array', items: { type: 'string' } },
    overclaims_or_unverified: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      properties: { claim: { type: 'string' }, source: { type: 'string' }, why: { type: 'string' } },
      required: ['claim', 'source', 'why'] } },
    weakest_part: { type: 'string' },
    heal_first_order: { type: 'array', items: { type: 'string' } },
    score_sanity: { type: 'array', items: { type: 'string' } },
    overall_alive: { type: 'string', description: 'is the app alive overall? short verdict' },
  },
  required: ['missed', 'overclaims_or_unverified', 'weakest_part', 'heal_first_order', 'score_sanity', 'overall_alive'],
}

const CTX = [
  'You are auditing a deliverable we call THE APP: a prompt-engineering COURSE that teaches Data Science & Software Engineering prompt engineering, where every example is empirically validated on Claude Haiku 4.5 (and compared to Sonnet 4.6).',
  '',
  'USE ONLY read-only tools: Read, Grep, Glob. DO NOT use Bash (its safety classifier is currently unavailable). READ the actual files — never guess.',
  '',
  'Location: /Users/bibo/навчання промтів/',
  'Course files:',
  '- README.md (index, key findings, structure table)',
  '- 01-data-science.md (5 DS techniques, weak->strong with REAL Haiku output)',
  '- 02-software-engineering.md (6 SWE techniques)',
  '- 03-metodologiya-ta-syri-rezultaty.md (methodology, caveats, run table, reproduce instructions)',
  '- 04-top-sajty-i-shpargalka.md (top-3 sites, 13-principle cheat-sheet, exercise answers)',
  '- 05-rozshyrennya-haiku-vs-sonnet-uk.md (Haiku-vs-Sonnet comparison, new techniques, Ukrainian-language prompts)',
  '- 06-stabilnist-ta-antypaterny.md (N=5 format-reliability numbers, antipatterns, URL re-verification)',
  '- promt-inzhiniring-haiku-kurs.docx (generated single document; validation PASSED, 38 pages; binary — treat as given context, you cannot easily read it)',
  '',
  'Generation pipeline (workflow scripts that produced the validated data — read these for architecture/reproducibility):',
  '- /Users/bibo/.claude/projects/-Users-bibo-----------------/6085e5a9-e68d-4d94-b342-029a5542f2fa/workflows/scripts/haiku-prompt-eng-validation-wf_c3699d75-208.js',
  '- /Users/bibo/.claude/projects/-Users-bibo-----------------/6085e5a9-e68d-4d94-b342-029a5542f2fa/workflows/scripts/haiku-course-extensions-wf_a092010c-2f6.js',
  '- /Users/bibo/.claude/projects/-Users-bibo-----------------/6085e5a9-e68d-4d94-b342-029a5542f2fa/workflows/scripts/haiku-stability-antipatterns-wf_ad6c2be1-0db.js',
  'Raw JSON outputs (the actual model runs — the evidence base):',
  '- /private/tmp/claude-501/-Users-bibo-----------------/6085e5a9-e68d-4d94-b342-029a5542f2fa/tasks/w5zg0ukbt.output  (batch 1: 30 Haiku runs + 16 sites)',
  '- /private/tmp/claude-501/-Users-bibo-----------------/6085e5a9-e68d-4d94-b342-029a5542f2fa/tasks/w67fx5rvi.output  (batch 2: 25 runs)',
  '- /private/tmp/claude-501/-Users-bibo-----------------/6085e5a9-e68d-4d94-b342-029a5542f2fa/tasks/wv5azqjjf.output  (batch 3: 49 runs)',
  '',
  'The course CLAIMS: 104 total model runs (30 + 25 + 49), 11 techniques, 6 MD files + DOCX, all examples real (no fabrication), validated via the Agent harness because no raw API key was available.',
  '',
  'RIGOR RULES: report a weakness only if you can cite concrete evidence (file name + quote/line). Rate each finding confidence high/medium/low. List anything you could not verify in could_not_verify. Be specific, not generic.',
  '',
].join('\n')

const DIMS = [
  { key: 'architecture', instr: [
    'YOUR DIMENSION: ARCHITECTURE.',
    'Assess: (1) structure & organization of the 6 files + DOCX + generation scripts; (2) single source of truth vs duplication (e.g., are run-counts / findings hardcoded in many files so an edit can desync them?); (3) reproducibility — do the 3 workflow scripts + raw outputs actually let you regenerate the validated content? read the scripts; (4) modularity & extensibility — how hard is it to add a 7th technique or a new batch?; (5) the markdown->DOCX build path (is it repeatable, is the build script saved?); (6) naming/numbering consistency; (7) architectural smells.',
    'Give a 1-5 liveness score for ARCHITECTURE.',
  ].join('\n') },
  { key: 'functionality', instr: [
    'YOUR DIMENSION: FUNCTIONALITY.',
    'Assess whether THE APP fulfils its teaching purpose end-to-end: (1) technique coverage vs notable gaps; (2) do the weak->strong examples actually DEMONSTRATE the technique they claim (spot-check several by reading the real outputs)?; (3) are exercises present AND do the answers exist and look correct?; (4) internal navigation — READ files and verify a sample of internal markdown links/anchors resolve to real headings; (5) is the DOCX a usable artifact (note the known TOC-needs-refresh caveat)?; (6) could a real learner follow it start to finish?',
    'Give a 1-5 liveness score for FUNCTIONALITY.',
  ].join('\n') },
  { key: 'reliability', instr: [
    'YOUR DIMENSION: RELIABILITY / TRUSTWORTHINESS.',
    'This is the most important dimension — be a skeptic. (1) CROSS-FILE NUMERIC CONSISTENCY: hunt every quantitative claim (30/25/49/104 runs, 33/25/49 agents, 11 techniques, N=5, x/5 reliability figures) across ALL files and the raw outputs; reconcile them; report any contradiction. (2) Are the "validated"/"real Haiku output" claims actually backed by the raw JSON outputs? cross-check 2-3 specific quoted outputs (e.g. the DS4 markdown leak, the SE6 flatten answer, the N=5 "MIXED x5") against the raw .output files. (3) Methodology soundness & honesty: are the caveats (Agent-harness contamination, no raw API, small N, the SE3 Co-Authored-By leak) stated clearly and not overclaimed? (4) Are the top external URLs real/live as claimed? (5) Internal link integrity. Rate how much a skeptical reader can trust the course.',
    'Give a 1-5 liveness score for RELIABILITY.',
  ].join('\n') },
  { key: 'liveness', instr: [
    'YOUR DIMENSION: LIVENESS (Christopher Alexander generative-process sense).',
    'Judge THE APP as a living whole, not a feature checklist. (1) Wholeness — does each part strengthen the whole, or are some parts dead weight / redundant? (2) What is the SINGLE weakest center dragging down the life of the whole? (3) Is it "runnable"/usable end-to-end RIGHT NOW (a learner opens README and can actually learn)? (4) Felt quality & coherence — does it read as one coherent thing or a pile of batches? (5) If you could take ONE wholeness-preserving step to most increase its life, what would it be? (6) Honesty/“good for the user” — does it serve the learner truthfully?',
    'Give a 1-5 liveness score for the WHOLE app.',
  ].join('\n') },
]

log('Launching 4 dimension analyzers on Sonnet')
const analyses = (await parallel(DIMS.map(d => () =>
  agent(CTX + '\n' + d.instr, { model: 'sonnet', agentType: 'general-purpose', phase: 'Analyze', label: 'analyze:' + d.key, schema: DIM_SCHEMA })
    .then(r => r ? { key: d.key, ...r } : { key: d.key, failed: true })
))).filter(Boolean)

log('Analyzers done: ' + analyses.filter(a => !a.failed).length + '/4. Running completeness critic.')

const CRITIC_INSTR = [
  'YOUR ROLE: adversarial COMPLETENESS CRITIC.',
  'Below are the four dimension analyses as JSON. Re-read the actual files as needed.',
  'Tasks: (1) what did the four analyses MISS (a real gap, a file not examined, a claim not verified)?; (2) flag any OVERCLAIM or unverified weakness they reported that does not hold up against the files; (3) name the SINGLE weakest part of the whole app; (4) give a prioritized heal-first ORDER (most life gained first); (5) sanity-check their 1-5 scores; (6) give an overall verdict: is THE APP alive?',
  '',
  'THE FOUR ANALYSES (JSON):',
  JSON.stringify(analyses),
].join('\n')

const critic = await agent(CTX + '\n' + CRITIC_INSTR, { model: 'sonnet', agentType: 'general-purpose', phase: 'Verify', label: 'completeness-critic', schema: CRITIC_SCHEMA })

log('Audit complete')
return { analyses, critic }
