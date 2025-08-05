import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/chat/new'

  console.log('Auth callback - Code:', code ? 'present' : 'missing', 'Next:', next)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/login?error=Could not authenticate', request.url))
    }
  }

  // URL to redirect to after sign in process completes
  const redirectUrl = new URL(next, request.url)
  console.log('Auth callback - Redirecting to:', redirectUrl.toString())
  return NextResponse.redirect(redirectUrl)
}