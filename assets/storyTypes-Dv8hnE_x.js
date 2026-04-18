var e=`export type BehaviorStatus = 'done' | 'wip' | 'todo'

export interface Behavior {
  given: string
  when: string
  then: string
  status: BehaviorStatus
}

export interface Decision {
  title: string
  why: string
}

export interface StoryDoc {
  title: string
  number?: number
  scope: {
    description: string
    design?: string
  }
  behaviors: Behavior[]
  decisions?: Decision[]
}
`;export{e as default};