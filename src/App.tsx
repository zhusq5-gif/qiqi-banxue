import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Today from './pages/Today'
import Parent from './pages/Parent'
import { getProfile, getSessionUser, type Profile } from './lib/cloudbase'

const KnowledgeMap = lazy(() => import('./pages/KnowledgeMap'))
const CurriculumReview = lazy(() => import('./pages/CurriculumReview'))
const CurriculumStandards = lazy(() => import('./pages/CurriculumStandards'))
const StandardMappingReview = lazy(() => import('./pages/StandardMappingReview'))
const MathResearchSample = lazy(() => import('./pages/MathResearchSample'))
const MathFineGraphSample = lazy(() => import('./pages/MathFineGraphSample'))

type AppState = 'loading' | 'login' | 'onboarding' | 'ready'

function Splash() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-pulse text-5xl">⭐</div>
    </div>
  )
}

function RouteFallback() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center text-sm font-bold text-stone-400">
      正在加载课程知识模块…
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
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/today" element={<Today profile={profile!} />} />
        <Route
          path="/parent"
          element={<Parent profile={profile!} onProfileChange={setProfile} onLogout={bootstrap} />}
        />
        <Route path="/knowledge-map" element={<KnowledgeMap />} />
        <Route path="/knowledge-map/review" element={<CurriculumReview />} />
        <Route path="/knowledge-map/standards" element={<CurriculumStandards />} />
        <Route path="/knowledge-map/standards/review" element={<StandardMappingReview />} />
        <Route path="/knowledge-map/math-sample" element={<MathResearchSample />} />
        <Route path="/knowledge-map/math-sample/fine" element={<MathFineGraphSample />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </Suspense>
  )
}
