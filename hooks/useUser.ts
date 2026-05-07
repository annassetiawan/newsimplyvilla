'use client'

import { useEffect, useState } from 'react'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  villaName: string
  villaId: string
}

interface UseUserResult {
  user: UserData | null
  isLoading: boolean
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: UserData | null) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  return { user, isLoading }
}
