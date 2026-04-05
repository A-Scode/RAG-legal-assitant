import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useGetUser } from '@/hooks/useAuth'
import { useDeleteChatSession, useGetChatSessions, useUpdateChatSession } from '@/hooks/useChat'
import { cn, logout, formatRelativeDate } from '@/lib/utils'
import { useAuthStore, useUserStore } from '@/stores'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Outlet, redirect, useNavigate, useParams } from '@tanstack/react-router'
import { CreditCard, History, LogOut, MessageSquare, MoreVertical, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Search, Sparkles, Trash2, User } from 'lucide-react'
import { createContext, useContext, useEffect, useState } from 'react'

export interface ChatLayoutContextType {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  headerTitle: string
  setHeaderTitle: (title: string) => void
  history: HistoryItem[]
  setHistory: (history: HistoryItem[]) => void
}

interface HistoryItem {
  created_at: string
  session_id: string
  title: string
  updated_at: string
}

const ChatLayoutContext = createContext<ChatLayoutContextType | null>(null)

export const useChatLayout = () => {
  const context = useContext(ChatLayoutContext)
  if (!context) throw new Error('useChatLayout must be used within a ChatLayoutProvider')
  return context
}

export const Route = createFileRoute('/app/chat')({
  component: RouteComponent,
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({
        to: '/app/login',
      })
    }
  }
})

function RouteComponent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [headerTitle, setHeaderTitle] = useState("AI Legal Assistant")
  const [history, setHistory] = useState<HistoryItem[]>([])

  const {user} = useUserStore();
  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : '??'

  const { data } = useGetChatSessions();

  const queryClient = useQueryClient();

  useGetUser();

  useEffect(() => {
    if(data){
      setHistory(data.data);
    }
  },[data])


  const navigate = useNavigate();
  const params = useParams({ strict : false });
  const { mutate: deleteSession } = useDeleteChatSession();
  const { mutate: updateSession } = useUpdateChatSession();

  const [renameId, setRenameId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <ChatLayoutContext.Provider value={{
      sidebarOpen,
      setSidebarOpen,
      headerTitle,
      setHeaderTitle,
      history,
      setHistory
    }}>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
        <aside
          className={cn(
            "group relative flex flex-col border-r bg-muted/40 transition-all duration-300 ease-in-out z-20 shrink-0",
            sidebarOpen ? "w-80" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
          )}
        >
          <div className="flex items-center justify-between p-4 h-16 border-b shrink-0 overflow-hidden">
            {sidebarOpen && (<div className={cn("flex items-center gap-2 font-bold text-lg transition-opacity duration-300", !sidebarOpen && "lg:opacity-0")}>
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="truncate">Legal RAG AI</span>
            </div>)}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 ml-auto"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : (<><Sparkles className="group-hover:hidden w-5 h-5 text-primary" /><PanelLeftOpen className="group-hover:block hidden w-4 h-4" /></>)}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="p-4 shrink-0 space-y-2 overflow-hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className={cn("w-full gap-2 transition-all duration-300", sidebarOpen ? "justify-start px-4" : "justify-center px-0")} size="lg" onClick={() => navigate({to:"/app/chat"})}>
                  <Plus className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span className="truncate">New Chat</span>}
                </Button>
              </TooltipTrigger>
              {!sidebarOpen && <TooltipContent side="right">New Chat</TooltipContent>}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline"
                  className={cn("w-full gap-2 transition-all duration-300 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40", sidebarOpen ? "justify-start px-4" : "justify-center px-0")} 
                  size="lg" 
                  onClick={() => navigate({to:"/app/documents"})}
                >
                  <Search className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span className="truncate text-[10px] font-black uppercase tracking-widest">Search Docs</span>}
                </Button>
              </TooltipTrigger>
              {!sidebarOpen && <TooltipContent side="right">Search Documents</TooltipContent>}
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
                <Tooltip key={chat.session_id} delayDuration={500}>
                  <TooltipTrigger asChild>
                    <div 
                      onClick={() => navigate({ 
                        to: `/app/chat/$chatSessionId`, 
                        params: { chatSessionId: chat.session_id },
                        search: { prompt: undefined }
                      })}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group relative cursor-pointer border border-transparent",
                        !sidebarOpen && "justify-center px-0",
                        params.chatSessionId === chat.session_id 
                          ? "bg-background shadow-sm border-border ring-1 ring-primary/5" 
                          : "hover:bg-muted/50 hover:border-border/30"
                      )}
                    >
                      {/* Active Indicator Bar */}
                      {params.chatSessionId === chat.session_id && sidebarOpen && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
                      )}
                      <div className="relative">
                        <MessageSquare className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:scale-110" />
                        {!sidebarOpen && <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border-2 border-background animate-pulse" />}
                      </div>
                      {sidebarOpen && (
                        <>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-medium truncate block max-w-[150px] lg:max-w-[180px]">{chat.title}</span>
                            <span className="text-[10px] text-muted-foreground">{formatRelativeDate(chat.created_at)}</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={(e) => {
                                e.stopPropagation();
                                setRenameId(chat.session_id);
                                setNewName(chat.title);
                              }}>
                                <Pencil className="mr-2 w-4 h-4" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(chat.session_id);
                                }}
                              >
                                <Trash2 className="mr-2 w-4 h-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
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
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {sidebarOpen && <span className="truncate text-sm font-medium">@{user?.username || 'Guest'}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({to: "/app/profile"})}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({to: "/app/settings"})}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={logout}>
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
              
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("w-full gap-3 transition-all duration-300", sidebarOpen ? "justify-start px-2" : "justify-center px-0")}>
                  <Avatar className="w-9 h-9 border-2 border-background ring-1 ring-muted shadow-lg">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
                  {sidebarOpen && <span className="truncate text-sm font-medium">{`${user?.first_name} ${user?.last_name}`}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({to: "/app/profile"})}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({to: "/app/settings"})}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-hidden relative flex flex-col">
            <Outlet />
          </main>
        </div>
      </div>

      <Dialog open={!!renameId} onOpenChange={(open) => !open && setRenameId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>Enter a new name for this chat session.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Chat name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateSession({ session_id: renameId!, title: newName }, { onSuccess: () => { setRenameId(null); queryClient.invalidateQueries({ queryKey: ["chat-sessions"] }); } });
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameId(null)}>Cancel</Button>
            <Button onClick={() => updateSession({ session_id: renameId!, title: newName }, { onSuccess: () => { setRenameId(null); queryClient.invalidateQueries({ queryKey: ["chat-sessions"] }); } })}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteSession(deleteId!, { onSuccess: () => { setDeleteId(null); queryClient.invalidateQueries({ queryKey: ["chat-sessions"] }); } })}
            >
              Delete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChatLayoutContext.Provider>
  )
}
