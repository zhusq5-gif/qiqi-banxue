import { useState } from 'react'
import { auth } from '../lib/cloudbase'

type Mode = 'login' | 'register' | 'verify'

export default function Login({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  // 注册返回的 verifyOtp 回调（官方 v3 流程：signUp 发验证码 → verifyOtp 校验）
  const [verifyFn, setVerifyFn] = useState<((arg: { token: string }) => Promise<{ error?: unknown }>) | null>(null)

  async function submitLogin() {
    setMsg('')
    if (!email || !password) { setMsg('请填写邮箱和密码'); return }
    setBusy(true)
    const { error } = await auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) { setMsg('邮箱或密码错误'); return }
    onDone()
  }

  async function submitRegister() {
    setMsg('')
    if (!email.includes('@')) { setMsg('请填写正确的邮箱'); return }
    if (password.length < 8) { setMsg('密码至少 8 位'); return }
    setBusy(true)
    const { data, error } = await auth.signUp({ email, password })
    setBusy(false)
    if (error || !data) { setMsg('注册失败，请稍后再试'); return }
    const v = (data as { verifyOtp?: (arg: { token: string }) => Promise<{ error?: unknown }> }).verifyOtp
    if (!v) { setMsg('请查收验证邮件后直接登录'); setMode('login'); return }
    setVerifyFn(() => v)
    setMode('verify')
    setMsg('验证码已发送到邮箱，请查收')
  }

  async function submitVerify() {
    setMsg('')
    if (!code.trim()) { setMsg('请填写验证码'); return }
    setBusy(true)
    const res = verifyFn ? await verifyFn({ token: code.trim() }) : { error: 'expired' }
    if (res && (res as { error?: unknown }).error) {
      setBusy(false)
      setMsg('验证码错误或已过期')
      return
    }
    const { error } = await auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) { setMode('login'); setMsg('验证成功，请登录'); return }
    onDone()
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <div className="text-6xl">⭐</div>
        <h1 className="mt-2 text-3xl font-bold text-amber-600">七七伴学</h1>
        <p className="mt-1 text-sm text-stone-500">孩子的学习打卡与星星奖励</p>
      </div>

      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg">
        {mode !== 'verify' && (
          <>
            <label className="block text-sm font-medium text-stone-600">邮箱</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              className="mb-4 h-14 w-full rounded-2xl border border-stone-200 bg-amber-50/50 px-4 text-lg outline-none focus:border-amber-400"
              placeholder="家长邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
            />
            <label className="block text-sm font-medium text-stone-600">密码</label>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="mb-6 h-14 w-full rounded-2xl border border-stone-200 bg-amber-50/50 px-4 text-lg outline-none focus:border-amber-400"
              placeholder={mode === 'login' ? '登录密码' : '至少 8 位'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === 'login' ? (
              <button
                className="h-14 w-full rounded-2xl bg-amber-500 text-lg font-bold text-white shadow active:scale-[0.98] disabled:opacity-50"
                disabled={busy}
                onClick={submitLogin}
              >
                登录
              </button>
            ) : (
              <button
                className="h-14 w-full rounded-2xl bg-amber-500 text-lg font-bold text-white shadow active:scale-[0.98] disabled:opacity-50"
                disabled={busy}
                onClick={submitRegister}
              >
                注册
              </button>
            )}
            <button
              className="mt-4 w-full text-center text-sm text-stone-500 underline-offset-4 active:underline"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg('') }}
            >
              {mode === 'login' ? '没有账号？注册一个' : '已有账号？直接登录'}
            </button>
          </>
        )}

        {mode === 'verify' && (
          <>
            <p className="mb-2 text-center text-sm text-stone-600">验证码已发送至</p>
            <p className="mb-4 text-center font-bold">{email}</p>
            <input
              type="text"
              inputMode="numeric"
              className="mb-6 h-14 w-full rounded-2xl border border-stone-200 bg-amber-50/50 px-4 text-center text-2xl tracking-[0.5em] outline-none focus:border-amber-400"
              placeholder="验证码"
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
            />
            <button
              className="h-14 w-full rounded-2xl bg-amber-500 text-lg font-bold text-white shadow active:scale-[0.98] disabled:opacity-50"
              disabled={busy}
              onClick={submitVerify}
            >
              完成验证
            </button>
          </>
        )}

        {msg && <p className="mt-4 text-center text-sm text-red-500">{msg}</p>}
      </div>
    </div>
  )
}
