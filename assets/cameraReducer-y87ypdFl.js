var e=`import type { CameraTarget } from './cameraTarget'
import { clampScale } from './cameraDefaults'

export type ShotAdvance = 'time' | 'end' | 'signal'

export interface Shot {
  target: CameraTarget
  scale?: number
  duration?: number
  hold?: number
  advance: ShotAdvance
  /** Absolute timeline offset for advance:'time' (ms from sequence start) */
  at?: number
}

export type CameraMode = 'interact' | 'view'

export interface CameraState {
  x: number
  y: number
  scale: number
  mode: CameraMode
  paused: boolean
  shotIndex: number
  /** Incremented when a signal-advance cue fires */
  signalTick: number
}

export type CameraAction =
  | { type: 'USER_PAN'; dx: number; dy: number }
  | { type: 'USER_PAN_SET'; x: number; y: number }
  | { type: 'USER_ZOOM'; scale: number; x: number; y: number }
  | { type: 'PAUSE' }
  | { type: 'PLAY' }
  | { type: 'STOP' }
  | { type: 'SET_MODE'; mode: CameraMode }
  | { type: 'SHOT_END' }
  | { type: 'SIGNAL' }
  | { type: 'FOCUS_APPLY'; x: number; y: number; scale: number }
  | { type: 'RESET' }

export function cameraReducer(state: CameraState, action: CameraAction): CameraState {
  switch (action.type) {
    case 'USER_PAN':
      return { ...state, paused: true, x: state.x + action.dx, y: state.y + action.dy }
    case 'USER_PAN_SET':
      return { ...state, paused: true, x: action.x, y: action.y }
    case 'USER_ZOOM':
      return { ...state, paused: true, x: action.x, y: action.y, scale: clampScale(action.scale) }
    case 'PAUSE':
      return state.paused ? state : { ...state, paused: true }
    case 'PLAY':
      return { ...state, paused: false }
    case 'STOP':
      return { ...state, paused: true, shotIndex: 0 }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'SHOT_END':
      return { ...state, shotIndex: state.shotIndex + 1 }
    case 'SIGNAL':
      return { ...state, signalTick: state.signalTick + 1 }
    case 'FOCUS_APPLY':
      return { ...state, x: action.x, y: action.y, scale: clampScale(action.scale) }
    case 'RESET':
      return { ...state, x: 0, y: 0, scale: 1, shotIndex: 0 }
  }
}

export function createInitialCameraState(mode: CameraMode, paused: boolean): CameraState {
  return { x: 0, y: 0, scale: 1, mode, paused, shotIndex: 0, signalTick: 0 }
}
`;export{e as default};