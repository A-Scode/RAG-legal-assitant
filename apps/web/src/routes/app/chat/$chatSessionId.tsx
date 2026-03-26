import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/chat/$chatSessionId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/chat/$chat-session"!</div>
}
