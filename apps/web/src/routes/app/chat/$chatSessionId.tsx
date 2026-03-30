import { Markdown } from '@/components/markdown'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/stores'
import { createFileRoute } from '@tanstack/react-router'
import { SendHorizontal, User, Sparkles, Scale } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import useWebSocket , {ReadyState} from 'react-use-websocket'
import { toast } from 'sonner'

export const Route = createFileRoute('/app/chat/$chatSessionId')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      prompt: (search.prompt as string) || undefined,
    }
  },
})

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_BASE_URL

function RouteComponent() {
  const { prompt: initialPrompt } = Route.useSearch()
  const {chatSessionId} = Route.useParams()
  const [prompt, setPrompt] = useState('')
  const {token} = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Legal Assistant. I can help you analyze documents, draft agreements, or answer legal queries based on your uploaded library. How can I assist you today?",
      timestamp: new Date(),
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const {sendJsonMessage , lastJsonMessage , readyState } = useWebSocket(`${WEBSOCKET_URL}${chatSessionId}/?token=${token}`,{
    shouldReconnect: () => true,  
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  })


  useEffect(()=>{
    toast.info(`Connection Status: ${ReadyState[readyState]}`)
  } , [readyState])

  useEffect(()=>{
    console.log(lastJsonMessage)
  }, [lastJsonMessage])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle initial prompt from navigation
  useEffect(() => {
    if (initialPrompt && messages.length === 1) {
      const newMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: initialPrompt,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, newMessage])
      
      setTimeout(() => {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "I've received your query about \"" + initialPrompt + "\". I'm processing your request using the legal context provided...",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      }, 1000)
    }
  }, [initialPrompt])

  const handleSend = () => {
    if (!prompt.trim()) return

    sendJsonMessage({
      type: "query",
      message: prompt,
    })

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setPrompt('')

    setTimeout(() => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I've received your query about \"" + prompt + "\". I'm processing your request using the legal context provided...",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
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
                  <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  message.role === 'assistant' 
                    ? 'bg-card text-card-foreground border rounded-tl-none' 
                    : 'bg-primary text-primary-foreground border-primary rounded-tr-none'
                }`}>
                  {message.role === 'assistant' ? (
                    <Markdown content={message.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                disabled={!prompt.trim()}
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
    </div>
  )
}
