import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileTopBar } from './MobileTopBar'
import { useNavLayout } from '../../hooks/useNavLayout'

export function AppLayout() {
  const { attendanceOnly } = useNavLayout()

  return (
    <div className="gradient-bg flex min-h-[100dvh] flex-col">
      <MobileTopBar />

      <div
        className={`mx-auto flex w-full max-w-7xl flex-1 gap-4 p-4 lg:gap-6 lg:p-6 ${
          attendanceOnly ? 'pb-4 lg:pb-6' : 'pb-28 lg:pb-6'
        }`}
      >
        {!attendanceOnly && <Sidebar />}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      {!attendanceOnly && <BottomNav />}
    </div>
  )
}
