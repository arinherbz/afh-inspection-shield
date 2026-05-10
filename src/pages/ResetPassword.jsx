import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState('email') // 'email' or 'password'
  const { resetPassword, updatePassword } = useAuth()

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onEmailSubmit = async (data) => {
    setIsLoading(true)
    try {
      await resetPassword(data.email)
      setStep('password')
    } catch (error) {
      // Error handled in context
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data) => {
    setIsLoading(true)
    try {
      await updatePassword(data.password)
    } catch (error) {
      // Error handled in context
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-slate-800">
          {step === 'email' ? 'Reset your password' : 'Create new password'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {step === 'email'
            ? 'Enter your email and we will send you a link to reset your password'
            : 'Enter your new password below'}
        </p>
      </div>

      {step === 'email' ? (
        <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-5">
          <div>
            <label htmlFor="reset-email" className="form-label">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="reset-email"
                type="email"
                className={`form-input pl-10 ${emailErrors.email ? 'form-input-error' : ''}`}
                placeholder="you@example.com"
                {...registerEmail('email')}
              />
            </div>
            {emailErrors.email && (
              <p className="form-error">{emailErrors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Sending reset link...
              </span>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-5">
          <div>
            <label htmlFor="new-password" className="form-label">
              New password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input pl-10 pr-10 ${passwordErrors.password ? 'form-input-error' : ''}`}
                placeholder="Create a strong password"
                {...registerPassword('password')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-400" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400" />
                )}
              </button>
            </div>
            {passwordErrors.password && (
              <p className="form-error">{passwordErrors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm-new-password" className="form-label">
              Confirm new password
            </label>
            <div className="relative">
              <input
                id="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-input pr-10 ${passwordErrors.confirmPassword ? 'form-input-error' : ''}`}
                placeholder="Confirm your new password"
                {...registerPassword('confirmPassword')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-400" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400" />
                )}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <p className="form-error">{passwordErrors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Updating password...
              </span>
            ) : (
              'Update password'
            )}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        Remember your password?{' '}
        <Link
          to="/login"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}