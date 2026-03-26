import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { CreditCard, History, LogOut, MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, Sparkles, User } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/app/chat/_chat')({
  component: RouteComponent,
})

function RouteComponent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [headerTitle, setHeaderTitle] = useState("AI Legal Assistant")
  const [history, setHistory] = useState([
    { id: 2, title: "Drafting NDA for Startup", date: "1 hour ago" },
  ])

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <aside
        className={cn(
          "relative flex flex-col border-r bg-muted/40 transition-all duration-300 ease-in-out z-20 shrink-0",
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

      <div className="flex-1 flex flex-col min-w-0 h-screen">
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
              <h2 className="text-sm font-semibold truncate leading-none">
                {headerTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border-2 border-background ring-1 ring-muted shadow-lg">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground font-bold">JD</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-hidden relative">
          <Outlet context={{ sidebarOpen, setSidebarOpen, headerTitle, setHeaderTitle, history, setHistory }} />
        </main>
      </div>
    </div>
  )
}
