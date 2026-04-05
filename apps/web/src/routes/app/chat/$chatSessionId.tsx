import { Markdown } from '@/components/markdown'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore, useChatStore } from '@/stores'
import type { DocRefred, HistoryMessage } from '@/stores/chatStore'
import { createFileRoute } from '@tanstack/react-router'
import { SendHorizontal, User, Sparkles, Scale, Loader2, BookOpen, FileDown } from 'lucide-react'
import { exportElementToPdf } from '@/lib/pdf-utils'
import { useState, useRef, useEffect } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { DocumentViewer } from "@/components/document-viewer"

export const Route = createFileRoute('/app/chat/$chatSessionId')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      prompt: (search.prompt as string) || undefined,
    }
  },
})

type StreamMessage = { stage : "thinking" , content : string , isEnd : boolean }
| { stage : "tool_calling" , tool : string }
| { stage : "answer" , content : string , isEnd : boolean }
| { stage : "done" , content : string , docs_refered : DocRefred[]  }
| { stage : "error" , error : string , isEnd : boolean }

type SocketMessage = { type : "stream" , data : StreamMessage }
| { type : "history" , data : HistoryMessage[] }



const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_BASE_URL
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN

function RouteComponent() {
  const { prompt: initialPrompt } = Route.useSearch()
  const {chatSessionId} = Route.useParams()
  const [prompt, setPrompt] = useState('')
  const {token} = useAuthStore()
  
  // Store management
  const messages = useChatStore(state => state.getMessages(chatSessionId))
  const setMessages = (m: any) => useChatStore.getState().setMessages(chatSessionId, m)
  const hasHistoryLoaded = useChatStore(state => state.getHasHistoryLoaded(chatSessionId))
  const setHasHistoryLoaded = (l: boolean) => useChatStore.getState().setHasHistoryLoaded(chatSessionId, l)
  const initialPromptSent = useChatStore(state => state.getInitialPromptSent(chatSessionId))
  const setInitialPromptSent = (s: boolean) => useChatStore.getState().setInitialPromptSent(chatSessionId, s)

  const [selectedDoc, setSelectedDoc] = useState<{ url: string, title: string, page?: number } | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const {sendJsonMessage , readyState } = useWebSocket<SocketMessage>(`${WEBSOCKET_URL}${chatSessionId}/?token=${token}`,{
    shouldReconnect: () => true,  
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    onMessage: (event) => {
      try {
        const lastJsonMessage = JSON.parse(event.data) as SocketMessage
        console.log("WS RECV:", lastJsonMessage.type, lastJsonMessage.data)
        
        if (lastJsonMessage.type === 'history') {
          const historyData = lastJsonMessage.data.map((msg: any) => ({
            ...msg,
            created_at: new Date(msg.created_at)
          }))
          
          setMessages((prev: HistoryMessage[]) => {
            // Filter local messages to keep only those that are truly unique or still in-progress
            const ongoingMessages = prev.filter(localMsg => {
              // If a message is still "active" (streaming/thinking), keep it
              if (localMsg.status) return true;

              // Check if history already contains this message by ID or by content + role
              const isAlreadyInHistory = historyData.some(dbMsg => 
                dbMsg.id === localMsg.id || 
                (dbMsg.role === localMsg.role && dbMsg.content === localMsg.content)
              );

              return !isAlreadyInHistory;
            });

            // Combine history from DB with any truly unique local messages
            return [...historyData, ...ongoingMessages]
          })
          setHasHistoryLoaded(true)
        } else if (lastJsonMessage.type === 'stream') {
          const streamData = lastJsonMessage.data as StreamMessage

          setMessages((prev: HistoryMessage[]) => {
            const newMessages = [...prev]
            const lastMsg = newMessages[newMessages.length - 1]

            let currentMsg;
            if (!lastMsg || lastMsg.role !== 'assistant') {
              currentMsg = {
                id: crypto.randomUUID(),
                role: 'assistant' as const,
                content: '',
                thinking: '',
                status: 'Thinking...',
                created_at: new Date(),
                docs_refered: []
              }
              newMessages.push(currentMsg)
            } else {
              // Clone the last message to avoid mutating the original object in Strict Mode
              currentMsg = { ...lastMsg }
              newMessages[newMessages.length - 1] = currentMsg
            }

            if (streamData.stage === 'answer') {
              currentMsg.content += streamData.content
              currentMsg.status = 'Generating response...'
            } else if (streamData.stage === 'thinking') {
              if (!currentMsg.thinking) currentMsg.thinking = ''
              currentMsg.thinking += streamData.content
              currentMsg.status = 'Analyzing context...'
            } else if (streamData.stage === 'tool_calling') {
              currentMsg.status = `Running ${streamData.tool}...`
            } else if (streamData.stage === 'done') {
              currentMsg.status = undefined
              if (streamData.docs_refered) {
                 currentMsg.docs_refered = streamData.docs_refered
              }
            }
            return newMessages
          })
        }
      } catch (e) {
        console.error("Failed to parse websocket message", e)
      }
    }
  })

  useEffect(()=>{
    toast.info(`Connection Status: ${ReadyState[readyState]}`)
  } , [readyState])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle initial prompt from navigation
  useEffect(() => {
    if (initialPrompt && !initialPromptSent && readyState === ReadyState.OPEN && hasHistoryLoaded) {
      setInitialPromptSent(true)
      const newMessage: HistoryMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: initialPrompt,
        created_at: new Date(),
        docs_refered : []
      }
      
      sendJsonMessage({
        type: "query",
        message: initialPrompt,
      })

      setMessages((prev) => [...prev, newMessage, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        thinking: '',
        status: 'Thinking...',
        created_at: new Date(),
        docs_refered : []
      }])
    }
  }, [initialPrompt, readyState, hasHistoryLoaded, initialPromptSent, chatSessionId])

  const handleSend = () => {
    if (!prompt.trim()) return

    sendJsonMessage({
      type: "query",
      message: prompt,
    })

    const newMessage: HistoryMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      created_at: new Date(),
      docs_refered : []
    }

    setMessages((prev: HistoryMessage[]) => [...prev, newMessage, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      thinking: '',
      status: 'Thinking...',
      created_at: new Date(),
      docs_refered : []
    }])
    setPrompt('')
  }

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm relative border-l overflow-hidden">
      {/* Messages List */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full w-full">
          <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6 pb-12">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                } animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className="shrink-0">
                  <Avatar className={`w-9 h-9 border shadow-sm ${
                    message.role === 'assistant' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {message.role === 'assistant' ? (
                      <AvatarFallback className="bg-primary/5 text-primary">
                        <Scale className="w-5 h-5" />
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    )}
                    <AvatarImage />
                  </Avatar>
                </div>
                
                <div className={`flex flex-col gap-2 max-w-[85%] ${
                  message.role === 'assistant' ? 'items-start' : 'items-end'
                }`}>
                  
                  {message.status && message.role === 'assistant' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary text-xs font-medium rounded-full animate-pulse border border-primary/20 shadow-sm w-fit mb-1 transition-all duration-300">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {message.status}
                    </div>
                  )}

                  <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  message.role === 'assistant' 
                    ? 'bg-card text-card-foreground border rounded-tl-none' 
                    : 'bg-primary text-primary-foreground border-primary rounded-tr-none'
                }`}>
                  {message.role === 'assistant' ? (
                    <div className="space-y-4">
                      {message.thinking && (
                        <details className="text-sm bg-muted/50 rounded-lg p-3 text-muted-foreground border border-border/50 group [&_summary::-webkit-details-marker]:hidden">
                          <summary className="font-medium cursor-pointer flex items-center gap-2 select-none hover:text-foreground">
                            <Sparkles className="w-3 h-3 text-primary" />
                            Thinking Process
                            <span className="ml-auto text-xs text-muted-foreground group-open:hidden">Show</span>
                            <span className="ml-auto text-xs text-muted-foreground hidden group-open:block">Hide</span>
                          </summary>
                          <div className="pt-3 border-t border-border/50 mt-2">
                            <Markdown content={message.thinking} />
                          </div>
                        </details>
                      )}
                      {message.content && (
                        <div className="relative group/content">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="absolute -top-1 -right-1 opacity-0 group-hover/content:opacity-100 transition-opacity z-10 hover:bg-primary/10 hover:text-primary h-7 w-7 rounded-md"
                            title="Download as PDF"
                            onClick={() => {
                              const el = document.getElementById(`content-${message.id}`)
                              if (el) {
                                exportElementToPdf(el, {
                                  filename: `legal-answer-${message.id.slice(0, 8)}.pdf`,
                                  title: `AI Response - ${new Date().toLocaleDateString()}`
                                })
                              }
                            }}
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </Button>
                          <Markdown id={`content-${message.id}`} content={message.content} />
                        </div>
                      )}
                      
                      {message.docs_refered && message.docs_refered.length > 0 && (
                        <div className="pt-4 border-t border-border/50 space-y-2">
                          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Scale className="w-3 h-3" />
                            Document References
                          </h4>
                           <div className="flex flex-wrap gap-2">
                            {message.docs_refered.map((doc) => (
                              <button
                                key={doc.doc_id}
                                onClick={() => {
                                  setSelectedDoc({
                                    url: API_ORIGIN + doc.doc_url,
                                    title: doc.title,
                                    page: doc.pages?.[0]
                                  })
                                  setIsViewerOpen(true)
                                }}
                                className="flex items-center gap-2 px-2 py-1 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-md text-[11px] font-medium text-primary transition-colors group text-left"
                              >
                                <span className="truncate max-w-[150px]">{doc.title}</span>
                                {doc.pages && doc.pages.length > 0 && (
                                  <span className="text-[9px] bg-primary/10 px-1 rounded">
                                    P{doc.pages.join(', ')}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {message.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-background border-t">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-500"></div>
          <div className="relative bg-card border rounded-2xl shadow-xl overflow-hidden transition-all duration-300 group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/5">
            <Textarea
              placeholder="Ask your legal assistant anything..."
              className="w-full min-h-[60px] max-h-[200px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent resize-none p-4 pr-16 text-sm md:text-base leading-relaxed"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              disabled={!hasHistoryLoaded}
            />
            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  AI RAG Powered
                </span>
              </div>
              <Button 
                size="sm" 
                className="rounded-xl h-9 px-4 shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
                onClick={handleSend}
                disabled={!prompt.trim() || !hasHistoryLoaded}
              >
                <span className="mr-2 hidden sm:inline">Send</span>
                <SendHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            Legal AI can make mistakes. Verify important information with legal professionals.
          </p>
        </div>
      </div>

      {/* Document Viewer Sheet */}
      <Sheet open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <SheetContent side="right" className="min-w-[50vw] w-full sm:max-w-[50vw] p-0 flex flex-col border-l shadow-2xl transition-all duration-500 ease-in-out">
          <SheetHeader className="p-4 border-b bg-background/80 backdrop-blur sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <SheetTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {selectedDoc?.title || 'Document Viewer'}
                </SheetTitle>
                <SheetDescription className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                  Legal Reference Material
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-hidden relative">
            {selectedDoc && (
              <DocumentViewer 
                url={selectedDoc.url} 
                initialPage={selectedDoc.page} 
                className="border-0 rounded-none shadow-none"
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
