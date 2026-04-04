import type { ChatMessage } from '@os/ui/chat/types'
import type { ChatSession } from './chatStore'
import type { SdkMsg } from './chatSdkHandlers'

export function setupWs(
  ctx: {
    sessions: Map<string, ChatSession>
    getActiveSessionId(): string | null
    patch(id: string, p: Partial<ChatSession>): void
    pushMessage(id: string, msg: ChatMessage, extra?: Partial<ChatSession>): void
    makeMsg(role: ChatMessage['role'], content: string): ChatMessage
    commitAccumulated(s: ChatSession): ChatMessage[]
    notify(): void
    dropNextActive(): void
    localToServer: Map<string, string>
    serverToLocal: Map<string, string>
    resolveLocal(serverSessionId: string): string
  },
  sdkHandlers: Record<string, (id: string, msg: SdkMsg) => void>,
) {
  if (!import.meta.hot) return

  const { sessions, patch, pushMessage, makeMsg, commitAccumulated, notify, dropNextActive, localToServer, serverToLocal, resolveLocal } = ctx

  import.meta.hot.on('chat:server', (data: unknown) => {
    let msg: Record<string, unknown>
    try { msg = (typeof data === 'string' ? JSON.parse(data) : data) as Record<string, unknown> } catch { return }
    const t = msg.type as string
    const sid = msg.sessionId as string

    // SDK bypass envelope — dispatch to handler map
    if (t === 'sdk') {
      const sdkMsg = msg.msg as SdkMsg
      const handler = sdkHandlers[sdkMsg.type]
      if (handler) handler(resolveLocal(sid), sdkMsg)
      return
    }

    // Session lifecycle messages
    if (t === 'session-created') {
      const localId = msg.localId as string
      const local = sessions.get(localId)
      if (local) {
        localToServer.set(localId, sid)
        serverToLocal.set(sid, localId)
      }
      return
    }

    if (t === 'session-ready') {
      const commands = msg.commands as string[] | undefined
      patch(resolveLocal(sid), {
        sdkSessionId: msg.sdkSessionId as string,
        ...(commands ? { commands } : {}),
      })
      return
    }

    if (t === 'session-closed') {
      const localId = resolveLocal(sid)
      if (!sessions.has(localId)) return
      sessions.delete(localId)
      if (ctx.getActiveSessionId() === localId) dropNextActive()
      localToServer.delete(localId)
      serverToLocal.delete(sid)
      notify()
      return
    }

    if (t === 'session-interrupted') {
      const localId = resolveLocal(sid)
      const s = sessions.get(localId)
      if (!s) return
      const committed = commitAccumulated(s)
      sessions.set(localId, {
        ...s,
        state: 'idle', activity: 'idle', streamingText: '', thinkingText: '',
        messages: [...s.messages, ...committed],
      })
      notify()
      return
    }

    if (t === 'system-message') {
      pushMessage(resolveLocal(sid), makeMsg('system', msg.text as string), { state: 'idle', activity: 'idle' })
      return
    }

    if (t === 'create-failed') {
      console.error('[chat] create failed:', msg.error)
      return
    }

    if (t === 'resume-failed') {
      const failedLocalId = msg.localId as string
      console.error('[chat] resume failed:', msg.error)
      sessions.delete(failedLocalId)
      if (ctx.getActiveSessionId() === failedLocalId) dropNextActive()
      notify()
      return
    }

    if (t === 'session-error') {
      console.error('[chat]', msg.error)
      pushMessage(resolveLocal(sid), makeMsg('system', msg.error as string), { state: 'idle', activity: 'idle' })
    }
  })
}
