import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute, PublicOnlyRoute, PermissionRoute } from './components/auth/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { Attendance } from './pages/Attendance'
import { Employees } from './pages/Employees'
import { RegisterEmployee } from './pages/RegisterEmployee'
import { Login } from './pages/Login'
import { SetupSuperAdmin } from './pages/SetupSuperAdmin'
import { SystemUsers } from './pages/SystemUsers'
import { RolesPermissions } from './pages/RolesPermissions'
import { Finance } from './pages/Finance'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/setup" element={<SetupSuperAdmin />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route element={<PermissionRoute permission="dashboard.view" />}>
                  <Route index element={<Dashboard />} />
                </Route>
                <Route element={<PermissionRoute permission="attendance.view" />}>
                  <Route path="attendance" element={<Attendance />} />
                </Route>
                <Route element={<PermissionRoute permission="employees.view" />}>
                  <Route path="employees" element={<Employees />} />
                </Route>
                <Route element={<PermissionRoute permission="employees.register" />}>
                  <Route path="register" element={<RegisterEmployee />} />
                </Route>
                <Route element={<PermissionRoute permission="finance.view" />}>
                  <Route path="finance" element={<Finance />} />
                </Route>
                <Route element={<PermissionRoute permission="roles.view" />}>
                  <Route path="roles" element={<RolesPermissions />} />
                </Route>
                <Route element={<PermissionRoute permission="users.view" />}>
                  <Route path="users" element={<SystemUsers />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
