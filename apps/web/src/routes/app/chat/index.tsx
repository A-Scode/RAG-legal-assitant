import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { SendHorizontal, Sparkles, Scale, Shield, FileText } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from 'react'
import { useCreateChatSession } from '@/hooks/useChat'

export const Route = createFileRoute('/app/chat/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [prompt, setPrompt] = useState('')
  const { mutate: createSession, isPending } = useCreateChatSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleStartChat = () => {
    if (!prompt.trim() || isPending) return

    createSession(prompt.trim(), {
      onSuccess: (response) => {
        const sessionId = response.data.session_id
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
        navigate({
          to: '/app/chat/$chatSessionId',
          params: { chatSessionId: sessionId.toString() },
          search: { prompt: prompt.trim() }
        })
      }
    })
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-background/50 backdrop-blur-sm relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10 animate-pulse delay-700" />
      
      <div className="w-full max-w-3xl space-y-12 text-center animate-in fade-in zoom-in duration-700">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner mb-2 ring-1 ring-primary/20">
              <Scale className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text">
            How can I assist your <span className="text-primary">legal workflow</span> today?
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Analyze documents, draft agreements, or ask complex legal queries with AI-powered precision.
          </p>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-3xl blur-xl opacity-20 group-focus-within:opacity-100 transition duration-1000"></div>
          <div className="relative bg-card border-2 border-muted/50 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 group-focus-within:border-primary/50 group-focus-within:ring-8 group-focus-within:ring-primary/5">
            <Textarea
              placeholder="E.g., 'Summarize the liability section of the uploaded MSA' or 'Draft a mutual NDA'..."
              className="w-full min-h-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent resize-none p-6 text-lg leading-relaxed placeholder:text-muted-foreground/50"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleStartChat()
                }
              }}
              disabled={isPending}
            />
            <div className="flex items-center justify-between px-6 py-4 bg-muted/20 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-1 rounded-md">
                  <Shield className="w-3 h-3 text-primary" />
                  Privileged & Secure
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-1 rounded-md">
                  <FileText className="w-3 h-3 text-primary" />
                  RAG Enabled
                </div>
              </div>
              <Button 
                size="lg" 
                className="rounded-2xl h-12 px-8 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold"
                onClick={handleStartChat}
                disabled={!prompt.trim() || isPending}
              >
                {isPending ? "Initializing..." : (
                  <>
                    <span>Start Analysis</span>
                    <SendHorizontal className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {[
            { icon: Sparkles, title: "Drafting", desc: "Templates for NDAs, Employment, and Service Agreements." },
            { icon: Scale, title: "Compliance", desc: "Check your documents against current regulations." },
            { icon: FileText, title: "Review", desc: "Identify risks and extract key terms in seconds." }
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-muted/10 border hover:bg-muted/20 transition-colors group cursor-default">
              <item.icon className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-bold mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
