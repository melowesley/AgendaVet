'use client'

import React, { useEffect } from 'react'
import { initializeAuth } from '@/lib/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const cleanup = initializeAuth()
        return cleanup
    }, [])

    return <>{children}</>
}
