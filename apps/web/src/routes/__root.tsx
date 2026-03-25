import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TooltipProvider } from "@/components/ui/tooltip"

export const Route = createRootRoute({
    component: () => (
        <TooltipProvider>
            <Outlet/>
            {/* <TanStackRouterDevtools initialIsOpen={false} /> */}
        </TooltipProvider>
    )
})