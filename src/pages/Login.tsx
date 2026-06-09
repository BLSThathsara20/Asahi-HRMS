import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, Eye, EyeOff, Phone, KeyRound, ArrowLeft } from 'lucide-react'
import { AuthLayout } from '../components/auth/AuthLayout'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { checkLoginStatus, verifyPhoneForSetup } from '../lib/sanity/auth'

const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-asahi-blue/50 transition-colors'

type Step = 'email' | 'password' | 'setup-phone' | 'setup-password'

export function Login() {
  const { login, completeSetup } = useAuth()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetToEmail = () => {
    setStep('email')
    setPassword('')
    setPhone('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
  }

  const handleEmailContinue = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const status = await checkLoginStatus(email)

      if (status.status === 'not_found') {
        setError('No account found with this email. Contact your administrator.')
        return
      }

      setFirstName(status.firstName)

      if (status.status === 'pending_setup') {
        setStep('setup-phone')
      } else {
        setStep('password')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check account')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneVerify = async (e: FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) {
      setError('Please enter your phone number')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await verifyPhoneForSetup(email, phone)
      setStep('setup-password')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phone verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSetupComplete = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await completeSetup(email, phone, newPassword)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  const titles: Record<Step, { title: string; subtitle: string }> = {
    email: {
      title: 'Welcome back',
      subtitle: 'Sign in to Asahi Employee Management',
    },
    password: {
      title: `Hi ${firstName}`,
      subtitle: 'Enter your password to continue',
    },
    'setup-phone': {
      title: `Welcome, ${firstName}`,
      subtitle: 'First-time login — verify your phone number',
    },
    'setup-password': {
      title: 'Create your password',
      subtitle: 'Choose a secure password for your account',
    },
  }

  const { title, subtitle } = titles[step]

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      {step !== 'email' && (
        <button
          type="button"
          onClick={resetToEmail}
          className="mb-4 flex items-center gap-1.5 text-xs text-asahi-blue hover:underline cursor-pointer border-0 bg-transparent p-0"
        >
          <ArrowLeft size={14} />
          Use a different email
        </button>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {step === 'email' && (
          <motion.form
            key="email"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            onSubmit={handleEmailContinue}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Email
              </label>
              <input
                required
                type="email"
                autoComplete="email"
                className={inputClass}
                placeholder="you@asahigroup.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" loading={loading} size="lg" className="w-full" icon={<LogIn size={18} />}>
              Continue
            </Button>
          </motion.form>
        )}

        {step === 'password' && (
          <motion.form
            key="password"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            onSubmit={handlePasswordLogin}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Email
              </label>
              <input
                readOnly
                type="email"
                className={`${inputClass} opacity-70`}
                value={email}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={inputClass}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] cursor-pointer border-0 bg-transparent"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" loading={loading} size="lg" className="w-full" icon={<LogIn size={18} />}>
              Sign In
            </Button>
          </motion.form>
        )}

        {step === 'setup-phone' && (
          <motion.form
            key="setup-phone"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            onSubmit={handlePhoneVerify}
            className="space-y-4"
          >
            <div className="rounded-xl bg-asahi-blue/10 px-4 py-3 text-xs text-[var(--text-secondary)]">
              Your administrator registered this account. Enter the UK mobile number on file to
              verify your identity, then you will set your password.
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Phone Number
              </label>
              <input
                required
                type="tel"
                autoComplete="tel"
                className={inputClass}
                placeholder="07700 900000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button type="submit" loading={loading} size="lg" className="w-full" icon={<Phone size={18} />}>
              Verify Phone
            </Button>
          </motion.form>
        )}

        {step === 'setup-password' && (
          <motion.form
            key="setup-password"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            onSubmit={handleSetupComplete}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                New Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] cursor-pointer border-0 bg-transparent"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">
                Confirm Password
              </label>
              <input
                required
                type="password"
                autoComplete="new-password"
                className={inputClass}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="w-full"
              icon={<KeyRound size={18} />}
            >
              Complete Setup & Sign In
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
