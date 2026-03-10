import './App.css'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Outlet } from '@tanstack/react-router'

function App() {
  return (
    <>
      <Outlet></Outlet>
      <TanStackRouterDevtools initialIsOpen={false} />
    </>
  )
}

export default App
