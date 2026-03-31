import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { Search, FileText, ExternalLink, Loader2, BookOpen, Clock, Tag, Scale } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { DocumentViewer } from '@/components/document-viewer'
import { useAuthStore } from '@/stores'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN

export const Route = createFileRoute('/app/documents')({
  component: DocumentsSearchPage,
  beforeLoad: () => {
      if (!useAuthStore.getState().isAuthenticated) {
        throw redirect({
          to: '/app/login',
        })
      }
    }
})

type SearchResult = {
  doc_id: string
  title: string
  content: string
  pages: number | number[]
  doc_url: string
  score: number
  search_type?: 'title' | 'semantic'
}

function DocumentsSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<{ url: string, title: string, page?: number } | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const { token } = useAuthStore()

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!query.trim()) return

    if (!token) {
        toast.error('Your session has expired. Redirecting to login...')
        window.location.href = '/app/login'
        return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_ORIGIN}/api/documents/search/?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        toast.error('Session unauthorized. Please log in again.')
        return
      }

      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error(error)
      toast.error('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm overflow-hidden">
      <div className="container max-w-5xl mx-auto py-8 px-4 flex flex-col h-full space-y-8 overflow-hidden">
        
        {/* Header Section */}
        <div className="space-y-2 shrink-0">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Search className="w-8 h-8 text-primary" />
            </div>
            Document Intelligence
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Search through your entire legal library using semantic understanding. 
            Find specific clauses, precedents, and references across all your uploaded documents.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative group max-w-2xl shrink-0">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-500"></div>
          <div className="relative flex items-center gap-2 bg-card border rounded-2xl p-2 shadow-sm transition-all group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/5">
            <Search className="ml-3 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Termination clauses in vendor agreements..."
              className="border-0 focus-visible:ring-0 text-base h-12 bg-transparent"
            />
            <Button 
                type="submit" 
                disabled={loading}
                className="rounded-xl h-12 px-6 shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search Intelligence"}
            </Button>
          </div>
        </form>

        {/* Results Area */}
        <ScrollArea className="flex-1 -mx-4 px-4 pr-6">
          <div className="grid grid-cols-1 gap-4 pb-12">
            {results.length > 0 ? (
              results.map((result, idx) => (
                <Card 
                  key={`${result.doc_id}-${idx}`}
                  className="group hover:border-primary/40 transition-all duration-300 cursor-pointer overflow-hidden relative shadow-sm hover:shadow-md border bg-card/50"
                  onClick={() => {
                    const pageNum = Array.isArray(result.pages) ? result.pages[0] : result.pages
                    const docUrl = result.doc_url
                    
                    if (!docUrl) {
                        toast.error('Document source is missing or deleted')
                        return
                    }

                    const fullUrl = docUrl.startsWith('http') 
                        ? docUrl 
                        : `${API_ORIGIN.replace(/\/$/, '')}/${docUrl.replace(/^\//, '')}`
                    
                    setSelectedDoc({
                      url: fullUrl,
                      title: result.title,
                      page: pageNum
                    })
                    setIsViewerOpen(true)
                  }}
                >
                  <CardHeader className="pb-3 border-b bg-muted/10">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
                          <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                          {result.title}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                           <Badge 
                            variant="secondary" 
                            className={cn(
                                "text-[10px] uppercase font-black tracking-widest border-none shadow-sm",
                                result.search_type === 'title' 
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                            )}
                           >
                             {result.search_type === 'title' ? 'Title Match' : `Confidence: ${Math.round(result.score * 100)}%`}
                           </Badge>
                           <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5 opacity-60">
                             <Clock className="w-3 h-3" />
                             Page {Array.isArray(result.pages) ? result.pages.join(', ') : result.pages}
                           </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="relative">
                      <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 pl-2">
                        {result.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : query && !loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                <div className="p-4 bg-muted rounded-full">
                   <Search className="w-12 h-12 text-muted-foreground opacity-20" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-xl">No documents found</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Try adjusting your search query or using different keywords.
                  </p>
                </div>
              </div>
            ) : !loading && (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                 <div className="p-6 bg-primary/5 rounded-full border border-dashed border-primary/20">
                    <Tag className="w-12 h-12 text-primary/20" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="font-medium text-lg text-muted-foreground">Ready for analysis</h3>
                    <p className="text-muted-foreground text-sm">Enter a legal concept or keyword to search your library</p>
                 </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Side Panel Viewer */}
      <Sheet open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <SheetContent side="right" className="min-w-[50vw] w-full sm:max-w-[50vw] p-0 flex flex-col border-l shadow-2xl transition-all duration-500 ease-in-out">
          <SheetHeader className="p-4 border-b bg-background/80 backdrop-blur sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <SheetTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {selectedDoc?.title || 'Document Viewer'}
                </SheetTitle>
                <SheetDescription className="text-[10px] uppercase tracking-wider font-semibold opacity-70 flex items-center gap-2">
                    <Scale className="w-3 h-3" />
                    Contextual Analysis Mode
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-hidden">
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
