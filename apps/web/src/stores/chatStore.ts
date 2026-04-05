import { create } from 'zustand'

export type DocRefred = {
  doc_id : string,
  title : string,
  doc_url : string,
  pages : number[]
}

export type HistoryMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  status?: string
  created_at: Date,
  docs_refered : DocRefred[],
}

interface SessionState {
    messages: HistoryMessage[]
    hasHistoryLoaded: boolean
    initialPromptSent: boolean
}

interface ChatStore {
    sessions: Record<string, SessionState>
    getMessages: (sessionId: string) => HistoryMessage[]
    setMessages: (sessionId: string, messages: HistoryMessage[] | ((prev: HistoryMessage[]) => HistoryMessage[])) => void
    getHasHistoryLoaded: (sessionId: string) => boolean
    setHasHistoryLoaded: (sessionId: string, loaded: boolean) => void
    getInitialPromptSent: (sessionId: string) => boolean
    setInitialPromptSent: (sessionId: string, sent: boolean) => void
}

const EMPTY_MESSAGES: HistoryMessage[] = []

const DEFAULT_SESSION: SessionState = {
    messages: EMPTY_MESSAGES,
    hasHistoryLoaded: false,
    initialPromptSent: false
}

export const useChatStore = create<ChatStore>((set, get) => ({
    sessions: {},
    getMessages: (sessionId) => get().sessions[sessionId]?.messages || EMPTY_MESSAGES,
    setMessages: (sessionId, messagesAction) => set((state) => {
        const currentSession = state.sessions[sessionId] || { ...DEFAULT_SESSION }
        const newMessages = typeof messagesAction === 'function' ? messagesAction(currentSession.messages) : messagesAction
        
        // Only update if messages actually changed to avoid unnecessary re-renders
        if (newMessages === currentSession.messages) return state

        return {
            sessions: {
                ...state.sessions,
                [sessionId]: { ...currentSession, messages: newMessages }
            }
        }
    }),
    getHasHistoryLoaded: (sessionId) => get().sessions[sessionId]?.hasHistoryLoaded || false,
    setHasHistoryLoaded: (sessionId, loaded) => set((state) => {
        const currentSession = state.sessions[sessionId] || { ...DEFAULT_SESSION }
        if (currentSession.hasHistoryLoaded === loaded) return state
        
        return {
            sessions: {
                ...state.sessions,
                [sessionId]: { ...currentSession, hasHistoryLoaded: loaded }
            }
        }
    }),
    getInitialPromptSent: (sessionId) => get().sessions[sessionId]?.initialPromptSent || false,
    setInitialPromptSent: (sessionId, sent) => set((state) => {
        const currentSession = state.sessions[sessionId] || { ...DEFAULT_SESSION }
        if (currentSession.initialPromptSent === sent) return state

        return {
            sessions: {
                ...state.sessions,
                [sessionId]: { ...currentSession, initialPromptSent: sent }
            }
        }
    })
}))
