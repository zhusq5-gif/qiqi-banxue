import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import { getProfile, getSessionUser, type Profile } from './lib/cloudbase'

// 页面级代码分割：家长视图体积最大且仅家长使用，孩子今日页按需加载，缩小首屏关键路径
const Today = lazy(() => import('./pages/Today'))
const Parent = lazy(() => import('./pages/Parent'))

type AppState = 'loading' | 'login' | 'onboarding' | 'ready'

function Splash() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-pulse text-5xl">⭐</div>
    </div>
  )
}

export default function App() {
  const [state, setState] = useState<AppState>('loading')
  const [profile, setProfile] = useState<Profile | null>(null)

  const bootstrap = useCallback(async () => {
    setState('loading')
    try {
      const user = await getSessionUser()
      if (!user) {
        setState('login')
        return
      }
      const p = await getProfile()
      setProfile(p)
      setState(p ? 'ready' : 'onboarding')
    } catch {
      setState('login')
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  if (state === 'loading') return <Splash />
  if (state === 'login') return <Login onDone={bootstrap} />
  if (state === 'onboarding') return <Onboarding onDone={bootstrap} />

  return (
    <Routes>
      <Route path="/today" element={<Suspense fallback={<Splash />}><Today profile={profile!} /></Suspense>} />
      <Route
        path="/parent"
        element={<Suspense fallback={<Splash />}><Parent profile={profile!} onProfileChange={setProfile} onLogout={bootstrap} /></Suspense>}
      />
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  )
}
