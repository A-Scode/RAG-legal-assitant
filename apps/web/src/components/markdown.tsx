import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'

interface MarkdownProps {
  content: string
  className?: string
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <div className="rounded-md overflow-hidden my-4 border shadow-sm">
                <div className="bg-muted px-4 py-2 flex items-center justify-between border-b">
                  <span className="text-xs font-mono text-muted-foreground">{match[1]}</span>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: '0.85rem',
                    backgroundColor: '#1e1e1e',
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={cn("bg-muted px-1.5 py-0.5 rounded text-sm font-semibold", className)} {...props}>
                {children}
              </code>
            )
          },
          p: ({ children }) => <p className="mb-4 last:mb-0 leading-normal">{children}</p>,
          h1: ({ children }) => <h1 className="text-xl font-bold mb-4 mt-6">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-3 mt-5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-4">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/20 pl-4 py-1 my-4 italic text-muted-foreground">{children}</blockquote>,
          a: ({ children, href }) => <a href={href} className="text-primary underline hover:text-primary/80 transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>,
          table: ({ children }) => <div className="overflow-x-auto my-4 border rounded-lg whitespace-normal"><table className="w-full text-sm text-left border-collapse">{children}</table></div>,
          thead: ({ children }) => <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold">{children}</thead>,
          th: ({ children }) => <th className="px-4 py-2 border text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2 border text-left">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
