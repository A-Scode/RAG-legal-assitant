import { useState, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Skeleton } from './ui/skeleton'
import { cn } from '@/lib/utils'

// Set worker manually to avoid issues with vite
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface DocumentViewerProps {
  url: string
  initialPage?: number
  className?: string
}

export function DocumentViewer({ url, initialPage = 1, className }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(initialPage)
  const [scale, setScale] = useState(0.7)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(600)

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-4">
        <div className="p-4 bg-destructive/10 rounded-full">
          <ChevronLeft className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="font-bold">Document Unavailable</p>
          <p className="text-xs text-muted-foreground">No valid reference link was found for this item.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (initialPage) {
      setPageNumber(initialPage)
    }
  }, [initialPage, url])

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect
      if (width > 0) {
        setContainerWidth(width)
      }
    })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error)
    setLoading(false)
  }

  return (
    <div className={cn("flex flex-col h-full bg-muted/5 rounded-none overflow-hidden transition-all", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-background/95 backdrop-blur-md border-b sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/30 rounded-lg p-1 border shadow-inner">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-background"
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-3 flex items-center gap-1 min-w-[90px] justify-center">
              <input 
                type="number" 
                value={pageNumber} 
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  if (val > 0 && (!numPages || val <= numPages)) setPageNumber(val)
                }}
                className="w-10 bg-transparent text-center text-xs font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-primary"
              />
              <span className="text-[10px] text-muted-foreground font-semibold opacity-60">/ {numPages || '--'}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-background"
              onClick={() => setPageNumber(p => Math.min(numPages || p, p + 1))}
              disabled={numPages ? pageNumber >= numPages : false}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-muted/30 rounded-lg p-1 border mr-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-[10px] font-black w-14 text-center select-none text-primary tracking-tighter">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.min(3, s + 0.1))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-lg shadow-sm" asChild title="Open original document">
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1 bg-muted/20 relative group/viewer" ref={containerRef}>
        <div className="min-h-full py-12 px-6 flex flex-col items-center justify-start gap-8">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center gap-6 py-32">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div className="space-y-2 text-center animate-pulse">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Preparing Document</p>
                    <p className="text-[10px] text-muted-foreground/60 italic">Applying legal intelligence layers...</p>
                </div>
              </div>
            }
            error={
              <div className="flex flex-col items-center gap-4 py-32 text-destructive">
                <div className="p-4 bg-destructive/10 rounded-full">
                    <ExternalLink className="w-8 h-8" />
                </div>
                <div className="text-center space-y-1">
                    <p className="font-bold">Failed to load reference material</p>
                    <p className="text-xs opacity-70">The document might be temporarily unavailable</p>
                </div>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>Reinitialize</Button>
              </div>
            }
            className="flex flex-col items-center"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              width={containerWidth ? Math.max(containerWidth - 32, 400) : undefined}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-[0_20px_50px_rgba(0,0,0,0.1)] border bg-white rounded-md overflow-hidden transform-gpu transition-all duration-300 ring-1 ring-black/5"
              loading={<Skeleton className="h-[1000px] w-full rounded-md" />}
            />
          </Document>
        </div>
        
        {/* Responsive Overlay */}
        {!loading && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-2.5 bg-background/90 backdrop-blur-xl shadow-2xl border rounded-full opacity-0 group-hover/viewer:opacity-100 transition-all duration-500 hover:scale-105">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] whitespace-nowrap">
               Live Context Rendering
             </span>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
