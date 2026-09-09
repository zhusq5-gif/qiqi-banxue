import { useRef, useState } from 'react'
import { auth, checkEmailRegistered, sendResetCode, type ResetFlow } from '../lib/cloudbase'

type Mode = 'login' | 'register' | 'verify' | 'forgot'

/** 注册提交失败信息归类：已注册 / 其他 */
function mapRegisterError(err: unknown): string {
  const raw = String((err as { message?: string; msg?: string })?.message ?? (err as { code?: string })?.code ?? '')
  const lower = raw.toLowerCase()
  if (lower.includes('exist') || lower.includes('already') || lower.includes('registered') || raw.includes('已存在') || raw.includes('已注册') || lower.includes('duplicate')) {
    return '该邮箱已注册，请直接登录或使用忘记密码'
  }
  return '注册失败，请稍后再试'
}

export default function Login({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  // 注册返回的 verifyOtp 回调（官方 v3 流程：signUp 发验证码 → verifyOtp 校验）
  const [verifyFn, setVerifyFn] = useState<((arg: { token: string }) => Promise<{ error?: unknown }>) | null>(null)
  // 注册页邮箱可用性提示（null = 未探测/探测失败）
  const [emailHint, setEmailHint] = useState<{ ok: boolean; text: string } | null>(null)
  const hintSeq = useRef(0)
  // 忘记密码流程状态
  const [resetFlow, setResetFlow] = useState<ResetFlow | null>(null)
  const [newPassword, setNewPassword] = useState('')

  async function probeEmail(value: string) {
    const v = value.trim()
    if (!v.includes('@')) { setEmailHint(null); return }
    const seq = ++hintSeq.current
    const r = await checkEmailRegistered(v)
    if (seq !== hintSeq.current) return // 过期结果丢弃
    if (r === true) setEmailHint({ ok: false, text: '该邮箱已注册，请直接登录' })
    else if (r === false) setEmailHint({ ok: true, text: '✓ 该邮箱可以注册' })
    else setEmailHint(null)
  }

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
    let res: { data?: unknown; error?: unknown }
    try {
      res = await auth.signUp({ email, password })
    } catch (e) {
      setBusy(false)
      setMsg(mapRegisterError(e))
      return
    }
    setBusy(false)
    if (res.error || !res.data) { setMsg(mapRegisterError(res.error)); return }
    const v = (res.data as { verifyOtp?: (arg: { token: string }) => Promise<{ error?: unknown }> }).verifyOtp
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

  async function sendReset() {
    setMsg('')
    if (!email.includes('@')) { setMsg('请填写正确的邮箱'); return }
    setBusy(true)
    try {
      const flow = await sendResetCode(email)
      setResetFlow(flow)
      setMsg('重置验证码已发送到邮箱，请查收')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '重置邮件发送失败，请稍后再试')
    } finally {
      setBusy(false)
    }
  }

  async function submitReset() {
    setMsg('')
    if (!code.trim()) { setMsg('请填写验证码'); return }
    if (newPassword.length < 8) { setMsg('新密码至少 8 位'); return }
    if (!resetFlow) { setMode('login'); return }
    setBusy(true)
    const r = await resetFlow.confirm(code.trim(), newPassword)
    setBusy(false)
    if (r.error) { setMsg('验证码错误或已过期'); return }
    // 重置成功后尝试用新密码直接登录
    const { error } = await auth.signInWithPassword({ email, password: newPassword })
    if (error) { setMode('login'); setMsg('密码已重置，请用新密码登录'); return }
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
        {mode === 'forgot' && !resetFlow ? (
          <>
            <p className="mb-4 text-center text-sm text-stone-600">输入注册邮箱，我们将发送验证码帮你重置密码</p>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              className="mb-6 h-14 w-full rounded-2xl border border-stone-200 bg-amber-50/50 px-4 text-lg outline-none focus:border-amber-400"
              placeholder="家长邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
            />
            <button
              className="h-14 w-full rounded-2xl bg-amber-500 text-lg font-bold text-white shadow active:scale-[0.98] disabled:opacity-50"
              disabled={busy}
              onClick={sendReset}
            >
              发送重置验证码
            </button>
          </>
        ) : mode === 'forgot' ? (
          <>
            <p className="mb-2 text-center text-sm text-stone-600">重置密码，验证码已发送至</p>
            <p className="mb-4 text-center font-bold">{email}</p>
            <input
              type="text"
              inputMode="numeric"
              className="mb-4 h-14 w-full rounded-2xl border border-stone-200 bg-amber-50/50 px-4 text-center text-2xl tracking-[0.5em] outline-none focus:border-amber-400"
              placeholder="验证码"
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
            />
            <input
              type="password"
              autoComplete="new-password"
              className="mb-6 h-14 w-full rounded-2xl border border-stone-200 bg-amber-50/50 px-4 text-lg outline-none focus:border-amber-400"
              placeholder="新密码（至少 8 位）"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              className="h-14 w-full rounded-2xl bg-amber-500 text-lg font-bold text-white shadow active:scale-[0.98] disabled:opacity-50"
              disabled={busy}
              onClick={submitReset}
            >
              重置密码
            </button>
            <button
              className="mt-3 w-full text-center text-sm text-stone-500 underline-offset-4 active:underline"
              onClick={() => { setMode('login'); setMsg(''); setResetFlow(null); setCode(''); setNewPassword('') }}
            >
              返回登录
            </button>
          </>
        ) : mode === 'verify' ? (
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
        ) : (
          <>
            <label className="block text-sm font-medium text-stone-600">邮箱</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              className="mb-1 h-14 w-full rounded-2xl border border-stone-200 bg-amber-50/50 px-4 text-lg outline-none focus:border-amber-400"
              placeholder="家长邮箱"
              value={email}
              onChange={(e) => { setEmail(e.target.value.trim()); setEmailHint(null) }}
              onBlur={(e) => { if (mode === 'register') probeEmail(e.target.value) }}
            />
            {mode === 'register' && emailHint && (
              <p className={emailHint.ok ? 'mb-3 text-sm text-emerald-600' : 'mb-3 text-sm text-red-500'}>{emailHint.text}</p>
            )}
            {mode === 'register' && !emailHint && <div className="mb-3" />}
            <label className="block text-sm font-medium text-stone-600">密码</label>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="mb-6 h-14 w-full rounded-2xl border border-stone-200 bg-amber-50/50 px-4 text-lg outline-none focus:border-amber-400"
              placeholder={mode === 'login' ? '登录密码' : '至少 8 位'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') (mode === 'login' ? submitLogin : submitRegister)() }}
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
            <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
              <button
                className="underline-offset-4 active:underline"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg(''); setEmailHint(null) }}
              >
                {mode === 'login' ? '没有账号？注册一个' : '已有账号？直接登录'}
              </button>
              {mode === 'login' && (
                <button
                  className="underline-offset-4 active:underline"
                  onClick={() => { setMode('forgot'); setMsg(''); setPassword('') }}
                >
                  忘记密码？
                </button>
              )}
            </div>
          </>
        )}

        {msg && <p className="mt-4 text-center text-sm text-red-500">{msg}</p>}
      </div>
    </div>
  )
}
