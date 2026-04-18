/**
 * Chat plugin — engine 등록용. createCommandEngine({ plugins: [chatPlugin] }) 로 합성.
 *
 * keyMap 은 page 레이어 (PageAgentChat) 에서 별도 선언 — 여기서는 명령만 노출.
 */
import { definePlugin } from '@os/plugins/definePlugin'
import { chatCommands } from './chatCommands'

export const chatPlugin = definePlugin({
  name: 'chat',
  commands: {
    createSession: chatCommands.createSession,
    closeSession: chatCommands.closeSession,
    setActive: chatCommands.setActive,
    sendMessageLocal: chatCommands.sendMessageLocal,
    receiveMessage: chatCommands.receiveMessage,
    setState: chatCommands.setState,
    setMeta: chatCommands.setMeta,
    interrupt: chatCommands.interrupt,
    clearSession: chatCommands.clearSession,
    setModel: chatCommands.setModel,
    setComposerDraft: chatCommands.setComposerDraft,
    toggleBottomPanel: chatCommands.toggleBottomPanel,
    setSidebarMode: chatCommands.setSidebarMode,
  },
})
