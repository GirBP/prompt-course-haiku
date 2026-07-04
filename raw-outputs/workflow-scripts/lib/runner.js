// Shared helpers for the course validation workflows.
//
// NOTE ON PROVENANCE: the three batch scripts in ../ are FROZEN historical records
// of what actually ran (they each inline their own copy of runner()/J()/schemas).
// Do NOT rewrite them to import this module — that would falsify the "this is exactly
// what executed" guarantee. This module is the single source of truth for ANY FUTURE
// workflow, so the wrapper is never copy-pasted again.

// Wrap a test prompt so the agent answers as a plain assistant (no tools, no meta).
export function runner(promptText) {
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

// Join an array of lines into a multi-line prompt (or pass a string through).
export function J(x) {
  return Array.isArray(x) ? x.join('\n') : x
}

// Standard structured-output envelope that captures verbatim model output.
export const RESP_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: { response: { type: 'string', description: 'The assistant reply, verbatim' } },
  required: ['response'],
}
