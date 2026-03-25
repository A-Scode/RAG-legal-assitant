import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { 
  MessageSquare, 
  Plus, 
  SendHorizontal, 
  History,
  LogOut,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  CreditCard,
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

export const Route = createFileRoute('/app/chat/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)


  const history = [
    { id: 2, title: "Drafting NDA for Startup", date: "1 hour ago" },
  ]


  const messages = [
    { role: 'assistant', content: 'Hello! I am your AI Legal Assistant. How can I help you today?' },
    { role: 'user', content: 'What are the key clauses I should include in a standard NDA?' },
    { role: 'assistant', content: 'A standard Non-Disclosure Agreement (NDA) typically includes clauses defining confidential information, obligations of the receiving party, exclusions from confidential treatment, and the duration of the agreement. Would you like me to draft a sample for you?' },
  ]

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Sidebar - History */}
      <aside 
        className={cn(
          "relative flex flex-col border-r bg-muted/40 transition-all duration-300 ease-in-out z-20",
          sidebarOpen ? "w-80" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4 h-16 border-b shrink-0 overflow-hidden">
          <div className={cn("flex items-center gap-2 font-bold text-lg transition-opacity duration-300", !sidebarOpen && "lg:opacity-0")}>
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="truncate">Legal RAG AI</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="p-4 shrink-0 overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className={cn("w-full gap-2 transition-all duration-300", sidebarOpen ? "justify-start px-4" : "justify-center px-0")} size="lg">
                <Plus className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span className="truncate">New Chat</span>}
              </Button>
            </TooltipTrigger>
            {!sidebarOpen && <TooltipContent side="right">New Chat</TooltipContent>}
          </Tooltip>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 py-4 overflow-hidden">
            {sidebarOpen && (
              <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                History
              </p>
            )}
            {history.map((chat) => (
              <Tooltip key={chat.id} delayDuration={500}>
                <TooltipTrigger asChild>
                  <button className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/80 text-left transition-all duration-200 group relative",
                    !sidebarOpen && "justify-center px-0"
                  )}>
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:scale-110" />
                      {!sidebarOpen && <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border-2 border-background animate-pulse" />}
                    </div>
                    {sidebarOpen && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{chat.title}</span>
                        <span className="text-[10px] text-muted-foreground">{chat.date}</span>
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                {!sidebarOpen && <TooltipContent side="right">{chat.title}</TooltipContent>}
              </Tooltip>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-auto p-4 border-t bg-muted/20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn("w-full gap-3 transition-all duration-300", sidebarOpen ? "justify-start px-2" : "justify-center px-0")}>
                <Avatar className="w-6 h-6 border shadow-sm">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">JD</AvatarFallback>
                </Avatar>
                {sidebarOpen && <span className="truncate text-sm font-medium">John Doe</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      <main className="flex-1 flex flex-col relative min-w-0 bg-background/50">

        <header className="h-16 border-b flex items-center justify-between px-6 bg-background/60 backdrop-blur-md shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4 min-w-0">
            {!sidebarOpen && (
               <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <History className="w-5 h-5 text-muted-foreground" />
              </Button>
            )}
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm font-semibold truncate leading-none mb-1">
                NDA Drafting
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border-2 border-background ring-1 ring-muted shadow-lg">
              <AvatarImage src="" />
              <AvatarFallback className="bg-linear-to-tr from-primary to-primary/60 text-primary-foreground font-bold">JD</AvatarFallback>
            </Avatar>
          </div>
        </header>

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
