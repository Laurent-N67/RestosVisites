import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ApiError,
  getMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
} from '../api/client.ts'
import type { LoginRequest, RegisterRequest, Utilisateur } from '../api/types.ts'

// Nom du cache PWA défini dans vite.config.ts (workbox.runtimeCaching), à
// vider à la déconnexion pour éviter qu'un autre utilisateur du même
// appareil voie des réponses Api mises en cache pour la session précédente.
const PWA_API_CACHE_NAME = 'api-cache'

interface AuthContextValue {
  user: Utilisateur | null
  loading: boolean
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function clearApiCache(): Promise<void> {
  if ('caches' in window) {
    try {
      await caches.delete(PWA_API_CACHE_NAME)
    } catch {
      // Cache Storage indisponible (ex. mode privé) : rien de plus à faire.
    }
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Utilisateur | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const current = await getMe()
      setUser(current)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null)
      } else {
        throw err
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInitialUser() {
      try {
        const current = await getMe()
        if (!cancelled) {
          setUser(current)
        }
      } catch (err) {
        if (!cancelled && !(err instanceof ApiError && err.status === 401)) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadInitialUser()
    return () => {
      cancelled = true
    }
  }, [])

  async function login(payload: LoginRequest) {
    const current = await apiLogin(payload)
    setUser(current)
  }

  async function register(payload: RegisterRequest) {
    const current = await apiRegister(payload)
    setUser(current)
  }

  async function logout() {
    await apiLogout()
    setUser(null)
    await clearApiCache()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider.')
  }
  return context
}
