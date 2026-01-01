'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'

type VerificationStatus = 'verifying' | 'success' | 'error' | 'already-verified'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<VerificationStatus>('verifying')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    // Verify the email
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/verify-email?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
          return
        }

        if (data.alreadyVerified) {
          setStatus('already-verified')
          setMessage('Your email was already verified. Please log in to continue.')
        } else {
          setStatus('success')
          setMessage('Your email has been verified successfully! Please log in to continue.')
        }

        if (data.email) {
          setEmail(data.email)
        }

        // Sign out to clear old session, then redirect to login
        // This ensures the user gets a fresh session with emailVerified status
        setTimeout(async () => {
          await signOut({ redirect: false })
          router.push('/login?verified=true')
        }, 2000)
      } catch (error: any) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('Failed to verify email. Please try again.')
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'verifying' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
            {status === 'already-verified' && (
              <CheckCircle2 className="h-16 w-16 text-blue-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle>
            {status === 'verifying' && 'Verifying Your Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'already-verified' && 'Already Verified'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your email address...'}
            {(status === 'success' || status === 'already-verified') && 'Redirecting you to log in...'}
            {status === 'error' && 'There was a problem verifying your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div
              className={`p-4 rounded-lg ${
                status === 'success' || status === 'already-verified'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : status === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              <p className="text-sm">{message}</p>
              {email && (
                <p className="text-xs mt-2 opacity-75">
                  <Mail className="inline h-3 w-3 mr-1" />
                  {email}
                </p>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                The verification link may have expired or is invalid.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/resend-verification">Resend Link</Link>
                </Button>
              </div>
            </div>
          )}

          {(status === 'success' || status === 'already-verified') && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                You'll be redirected to log in. After logging in, you'll have full access to all features.
              </p>
              <Button asChild className="w-full">
                <Link href="/login?verified=true">Continue to Log In</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

