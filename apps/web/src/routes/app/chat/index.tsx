import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  SendHorizontal
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/stores"
import { useGetUser } from '@/hooks/useAuth'

export const Route = createFileRoute('/app/chat/')({
  component: RouteComponent,
  beforeLoad: () => {
    if(!useAuthStore.getState().isAuthenticated){
      throw redirect({ to: "/app/login" });
    }
  }
})

function RouteComponent() {
  useGetUser();

  // const {  user , setUser } = useUserStore()

  


  const messages = [
    { role: 'assistant', content: 'Hello! I am your AI Legal Assistant. How can I help you today?' },
    { role: 'user', content: 'What are the key clauses I should include in a standard NDA?' },
    { role: 'assistant', content: 'A standard Non-Disclosure Agreement (NDA) typically includes clauses defining confidential information, obligations of the receiving party, exclusions from confidential treatment, and the duration of the agreement. Would you like me to draft a sample for you?' },
  ]

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      
      <main className="flex-1 flex flex-col relative min-w-0 bg-background/50">


        <ScrollArea className="flex-1 px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-10 pb-10">
            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={cn(
                  "flex gap-4 group animate-in slide-in-from-bottom-2 duration-500",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className={cn(
                  "w-9 h-9 border-2 border-background shadow-md transition-transform group-hover:scale-110 shrink-0",
                  msg.role === 'assistant' ? "ring-1 ring-primary/20" : "ring-1 ring-muted"
                )}>
                  <AvatarFallback className={cn(
                    "font-bold text-xs",
                    msg.role === 'assistant' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {msg.role === 'assistant' ? 'AI' : 'JD'}
                  </AvatarFallback>
                </Avatar>
                
                <div className={cn(
                  "max-w-[80%] flex flex-col gap-1.5",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all hover:shadow-md",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-none ring-1 ring-primary/20" 
                      : "bg-card border rounded-tl-none ring-1 ring-muted/20"
                  )}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="px-6 py-6 border-t bg-background/80 backdrop-blur-sm z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center group">
              <Input 
                placeholder="Ask anything about legal documents..." 
                className="h-14 pl-5 pr-14 py-4 rounded-2xl border-2 border-muted bg-muted/30 focus-visible:bg-background focus-visible:ring-primary/20 focus-visible:border-primary transition-all text-base shadow-inner"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    className="absolute right-2 h-10 w-10 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95"
                  >
                    <SendHorizontal className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send Message</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3">
              <Separator className="flex-1 opacity-20" />
              <p className="text-[10px] text-center text-muted-foreground/60 font-medium uppercase tracking-widest whitespace-nowrap">
                Verify with Counsel • AI Assistant
              </p>
              <Separator className="flex-1 opacity-20" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
