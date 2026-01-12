'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      // 🔑 This converts the URL tokens into real login cookies
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      )

      if (error) {
        console.error('Auth callback error:', error.message)
        router.replace('/auth/login')
        return
      }

      // ✅ Cookies are now set → middleware will see the user
      router.replace('/profile')
    }

    run()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center text-lg">
      Signing you in…
    </div>
  )
}
