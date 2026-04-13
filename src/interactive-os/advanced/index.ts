// Escape hatch for advanced human developers.
// LLM 시스템 프롬프트(aria.md)에는 등장하지 않는다.
// composite/non-standard 패턴이 필요할 때만 사용한다.

export { useAria } from '../primitives/useAria';
export { useAriaZone } from '../primitives/useAriaZone';
export { useControlledAria } from '../primitives/useControlledAria';

export { composePattern } from '../pattern/composePattern';

export { createCommandEngine } from '../engine/createCommandEngine';
export { useEngine } from '../engine/useEngine';

export { definePlugin } from '../plugins/definePlugin';
export type { Plugin, Command, Middleware } from '../engine/types';
export type { KeyHandler } from '../axis/types';
