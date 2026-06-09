import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileTopBar } from './MobileTopBar'
import { SiteFooter } from './SiteFooter'
import { useNavLayout } from '../../hooks/useNavLayout'

export function AppLayout() {
  const { attendanceOnly } = useNavLayout()

  return (
    <div className="gradient-bg flex min-h-[100dvh] flex-col">
      <MobileTopBar />

      <div
        className={`mx-auto flex w-full max-w-7xl flex-1 gap-4 p-4 lg:gap-6 lg:p-6 ${
          attendanceOnly ? 'pb-2' : 'pb-2 lg:pb-6'
        }`}
      >
        {!attendanceOnly && <Sidebar />}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <SiteFooter
        className={
          attendanceOnly
            ? 'pb-[max(1rem,env(safe-area-inset-bottom))]'
            : 'pb-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))] lg:pb-[max(1rem,env(safe-area-inset-bottom))]'
        }
      />
      {!attendanceOnly && <BottomNav />}
    </div>
  )
}
