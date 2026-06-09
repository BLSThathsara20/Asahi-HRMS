import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileTopBar } from './MobileTopBar'

export function AppLayout() {
  return (
    <div className="gradient-bg flex min-h-[100dvh] flex-col">
      <MobileTopBar />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 p-4 pb-28 lg:gap-6 lg:p-6 lg:pb-6">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
