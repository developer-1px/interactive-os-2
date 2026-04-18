var e=`// ② 2026-03-27-claude-chat-phase-a-prd.md

// Open envelope — type string discriminator, rest is payload.
// No union: new message types don't require protocol changes.

export type ChatWsClientMessage = { type: string; [k: string]: unknown }
export type ChatWsServerMessage = { type: string; [k: string]: unknown }
`;export{e as default};