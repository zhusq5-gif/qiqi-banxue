import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import { getProfile, getSessionUser, type Profile } from './lib/cloudbase'

// Preserve main-app page-level splitting while keeping curriculum routes isolated behind their own lazy chunks.
const Today = lazy(() => import('./pages/Today'))
const Parent = lazy(() => import('./pages/Parent'))
const KnowledgeMap = lazy(() => import('./pages/KnowledgeMap'))
const CurriculumReview = lazy(() => import('./pages/CurriculumReview'))
const CurriculumVerification = lazy(() => import('./pages/CurriculumVerificationWave2'))
const CurriculumReviewCenter = lazy(() => import('./pages/CurriculumReviewCenter'))
const CurriculumHumanReview = lazy(() => import('./pages/CurriculumHumanReview'))
const CurriculumHumanReviewCurrent = lazy(() => import('./pages/CurriculumHumanReviewCurrent'))
const CurriculumHumanReviewIngestion = lazy(() => import('./pages/CurriculumHumanReviewIngestion'))
const CurriculumHumanReviewProposal = lazy(() => import('./pages/CurriculumHumanReviewProposal'))
const CurriculumAIDiscovery = lazy(() => import('./pages/CurriculumAIDiscovery'))
const CurriculumAIDomainCoverage = lazy(() => import('./pages/CurriculumAIDomainCoverage'))
const CurriculumAIHumanReviewQueue = lazy(() => import('./pages/CurriculumAIHumanReviewQueue'))
const CurriculumContentApproval = lazy(() => import('./pages/CurriculumContentApproval'))
const CurriculumStandards = lazy(() => import('./pages/CurriculumStandards'))
const StandardMappingReview = lazy(() => import('./pages/StandardMappingReview'))
const MathResearchSample = lazy(() => import('./pages/MathResearchSample'))
const MathFineGraphSample = lazy(() => import('./pages/MathFineGraphSample'))
const MathNormalizedSample = lazy(() => import('./pages/MathNormalizedSample'))

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
    <Routes>
      <Route path="/today" element={<Suspense fallback={<Splash />}><Today profile={profile!} /></Suspense>} />
      <Route
        path="/parent"
        element={<Suspense fallback={<Splash />}><Parent profile={profile!} onProfileChange={setProfile} onLogout={bootstrap} /></Suspense>}
      />
      <Route path="/knowledge-map" element={<Suspense fallback={<RouteFallback />}><KnowledgeMap /></Suspense>} />
      <Route path="/knowledge-map/review" element={<Suspense fallback={<RouteFallback />}><CurriculumReview /></Suspense>} />
      <Route path="/knowledge-map/verification" element={<Suspense fallback={<RouteFallback />}><CurriculumVerification /></Suspense>} />
      <Route path="/knowledge-map/review-center" element={<Suspense fallback={<RouteFallback />}><CurriculumReviewCenter /></Suspense>} />
      <Route path="/knowledge-map/human-review" element={<Suspense fallback={<RouteFallback />}><CurriculumHumanReview /></Suspense>} />
      <Route path="/knowledge-map/human-review/current" element={<Suspense fallback={<RouteFallback />}><CurriculumHumanReviewCurrent /></Suspense>} />
      <Route path="/knowledge-map/human-review/ingest" element={<Suspense fallback={<RouteFallback />}><CurriculumHumanReviewIngestion /></Suspense>} />
      <Route path="/knowledge-map/human-review/proposal" element={<Suspense fallback={<RouteFallback />}><CurriculumHumanReviewProposal /></Suspense>} />
      <Route path="/knowledge-map/human-review/ai" element={<Suspense fallback={<RouteFallback />}><CurriculumAIHumanReviewQueue /></Suspense>} />
      <Route path="/knowledge-map/content-approval" element={<Suspense fallback={<RouteFallback />}><CurriculumContentApproval /></Suspense>} />
      <Route path="/knowledge-map/discovery" element={<Suspense fallback={<RouteFallback />}><CurriculumAIDiscovery /></Suspense>} />
      <Route path="/knowledge-map/discovery/domains" element={<Suspense fallback={<RouteFallback />}><CurriculumAIDomainCoverage /></Suspense>} />
      <Route path="/knowledge-map/standards" element={<Suspense fallback={<RouteFallback />}><CurriculumStandards /></Suspense>} />
      <Route path="/knowledge-map/standards/review" element={<Suspense fallback={<RouteFallback />}><StandardMappingReview /></Suspense>} />
      <Route path="/knowledge-map/math-sample" element={<Suspense fallback={<RouteFallback />}><MathResearchSample /></Suspense>} />
      <Route path="/knowledge-map/math-sample/fine" element={<Suspense fallback={<RouteFallback />}><MathFineGraphSample /></Suspense>} />
      <Route path="/knowledge-map/math-sample/normalized" element={<Suspense fallback={<RouteFallback />}><MathNormalizedSample /></Suspense>} />
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  )
}
