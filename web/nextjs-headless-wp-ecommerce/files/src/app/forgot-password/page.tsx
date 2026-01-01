'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Mail, ShoppingBag, ArrowLeft } from 'lucide-react'
import { sendPasswordResetEmail } from '@/lib/auth-woocommerce'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  })

  async function onSubmit(data: ForgotPasswordForm) {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await sendPasswordResetEmail(data.email)
      
      if (result) {
        setSuccess(
          'Password reset email sent! Please check your email for instructions to reset your password.'
        )
        form.reset()
      } else {
        setError('No account found with this email address')
      }
    } catch (error: unknown) {
      console.error('Password reset error:', error)
      setError('Failed to send password reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold">
            <ShoppingBag className="h-8 w-8" />
            FU Store
          </Link>
          <p className="text-muted-foreground mt-2">
            Forgot your password? No problem!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Mail className="h-5 w-5" />
              Reset Your Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!success ? (
              <>
                <div className="text-center text-sm text-muted-foreground mb-6">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      {...form.register('email')}
                      disabled={isLoading}
                      className="mt-1"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center space-y-4">
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
                
                <div className="text-sm text-muted-foreground">
                  <p>Didn&apos;t receive the email?</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>• Check your spam/junk folder</li>
                    <li>• Make sure you entered the correct email</li>
                    <li>• Wait a few minutes for delivery</li>
                  </ul>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSuccess(null)
                    setError(null)
                  }}
                >
                  Send Another Email
                </Button>
              </div>
            )}

            <Separator className="my-6" />

            <div className="text-center text-sm space-y-4">
              <Link 
                href="/login" 
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
              
              <div>
                <span className="text-muted-foreground">Don&apos;t have an account? </span>
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </div>
              
              <div className="pt-2">
                <Link href="/" className="text-muted-foreground hover:text-primary text-sm">
                  ← Back to Store
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}