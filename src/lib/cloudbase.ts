import cloudbase from '@cloudbase/js-sdk'

const app = cloudbase.init({
  env: import.meta.env.VITE_TCB_ENV_ID,
  region: import.meta.env.VITE_TCB_REGION || 'ap-shanghai',
  accessKey: import.meta.env.VITE_TCB_ACCESS_KEY,
  auth: { detectSessionInUrl: true },
})

export const auth = app.auth
// SDK rdb() 链式查询类型定义尚不完整，统一以 any 使用并在此层封装类型安全接口
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = app.rdb()

export interface Profile {
  id: string; owner_id: string; name: string; avatar_id: string; birthday: string; created_at: string
}
export interface Subject {
  id: string; owner_id: string; name: string; icon_id: string; stars: number; archived_at: string | null; created_at: string
}
export interface Checkin {
  id: string; owner_id: string; subject_id: string; date: string; stars_awarded: number; created_at: string
}
export interface LedgerEntry {
  id: string; owner_id: string; delta: number; reason: string; ref_type: string | null; ref_id: string | null; created_at: string
}
export interface Wish {
  id: string; owner_id: string; title: string; stars: number; archived_at: string | null; created_at: string
}

/** 会话判定唯一入口：data.session 不存在即未登录（官方要求，勿用 getLoginState/getUser） */
export async function getSessionUser(): Promise<{ id: string } | null> {
  const { data } = await auth.getSession()
  const u = (data as { session?: { user?: { id?: string } } })?.session?.user
  return u?.id ? { id: u.id } : null
}

// ---------- 密码重置 / 邮箱可用性 ----------

/** 探测邮箱是否已注册（注册页失焦提示）。探测失败返回 null，不阻断注册流程 */
export async function checkEmailRegistered(email: string): Promise<boolean | null> {
  try {
    const a = auth as unknown as { isUsernameRegistered?: (u: string) => Promise<boolean> }
    if (typeof a.isUsernameRegistered === 'function') {
      // 实测（2026-09-09）：已注册返回 {"exist":true}，未注册返回 {}（exist 缺省→undefined）
      const r = await a.isUsernameRegistered(email)
      return r === true
    }
  } catch (e) {
    // 兜底：若服务端以 not_found 错误代替空对象，同样判定未注册
    const raw = String((e as { message?: string })?.message ?? e)
    if (/not[_ ]?found|不存在|USER_NOT_FOUND/i.test(raw)) return false
    /* 其余探测失败静默 */
  }
  return null
}

export interface ResetFlow {
  /** 传入邮箱验证码与新密码，完成重置（服务端一步校验+改密） */
  confirm: (code: string, newPassword: string) => Promise<{ error?: string }>
}

/** 发送密码重置验证码到邮箱，返回确认回调 */
export async function sendResetCode(email: string): Promise<ResetFlow> {
  const { data, error } = await auth.resetPasswordForEmail(email)
  if (error || !data) {
    const raw = (error as { message?: string })?.message || ''
    if (/not[_ ]?found|不存在/i.test(raw)) throw new Error('该邮箱未注册')
    throw new Error(raw || '重置邮件发送失败，请稍后再试')
  }
  const updateUser = (data as { updateUser?: (a: { nonce: string; password: string }) => Promise<{ error?: { message?: string } }> })
    .updateUser
  if (!updateUser) throw new Error('重置流程初始化失败，请稍后再试')
  return {
    async confirm(code, newPassword) {
      const res = await updateUser({ nonce: code, password: newPassword })
      return res && res.error ? { error: res.error.message || '重置失败' } : {}
    },
  }
}

// ---------- 档案 ----------

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await db.from('profiles').select('*').limit(1)
  if (error) throw new Error(error.message)
  return (data && data[0]) || null
}

export async function createProfile(p: { name: string; avatar_id: string; birthday: string }): Promise<Profile> {
  const { error } = await db.from('profiles').insert(p)
  if (error) throw new Error(error.message)
  const prof = await getProfile()
  if (!prof) throw new Error('档案创建失败')
  return prof
}

export async function updateProfile(id: string, patch: Partial<Pick<Profile, 'name' | 'avatar_id' | 'birthday'>>) {
  const { error } = await db.from('profiles').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------- 科目 ----------

export async function listSubjects(activeOnly = true): Promise<Subject[]> {
  let q = db.from('subjects').select('*')
  if (activeOnly) q = q.is('archived_at', null)
  const { data, error } = await q.order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createSubject(s: { name: string; icon_id: string; stars: number }) {
  const { error } = await db.from('subjects').insert(s)
  if (error) throw new Error(error.message)
}

export async function updateSubject(id: string, patch: Partial<Pick<Subject, 'name' | 'icon_id' | 'stars'>>) {
  const { error } = await db.from('subjects').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function archiveSubject(id: string) {
  const { error } = await db.from('subjects').update({ archived_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------- 打卡 ----------

export async function listCheckinsOn(date: string): Promise<Checkin[]> {
  const { data, error } = await db.from('checkins').select('*').eq('date', date)
  if (error) throw new Error(error.message)
  return data || []
}

export async function listCheckinsBetween(from: string, to: string): Promise<Checkin[]> {
  const { data, error } = await db.from('checkins').select('*').gte('date', from).lte('date', to)
  if (error) throw new Error(error.message)
  return data || []
}

export interface CheckinResult { ok: boolean; already: boolean; stars?: number; error?: string }

/** 打卡（数据库函数原子事务，唯一约束冲突幂等返回 already=true） */
export async function rpcCheckin(subjectId: string, date: string): Promise<CheckinResult> {
  const { data, error } = await db.rpc('checkin', { p_subject_id: subjectId, p_date: date })
  if (error) throw new Error(error.message)
  return data as CheckinResult
}

// ---------- 星星账本 ----------

export async function listLedger(): Promise<LedgerEntry[]> {
  const { data, error } = await db.from('star_ledger').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export function sumLedger(entries: LedgerEntry[]): number {
  return entries.reduce((s, e) => s + e.delta, 0)
}

// ---------- 心愿 ----------

export async function listWishes(activeOnly = true): Promise<Wish[]> {
  let q = db.from('wishes').select('*')
  if (activeOnly) q = q.is('archived_at', null)
  const { data, error } = await q.order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createWish(w: { title: string; stars: number }) {
  const { error } = await db.from('wishes').insert(w)
  if (error) throw new Error(error.message)
}

export async function updateWish(id: string, patch: Partial<Pick<Wish, 'title' | 'stars'>>) {
  const { error } = await db.from('wishes').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function archiveWish(id: string) {
  const { error } = await db.from('wishes').update({ archived_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}

export interface RedeemResult { ok: boolean; stars_spent?: number; balance?: number; error?: string }

/** 兑换心愿（数据库函数原子事务：校验余额→扣减→记录） */
export async function rpcRedeem(wishId: string): Promise<RedeemResult> {
  const { data, error } = await db.rpc('redeem', { p_wish_id: wishId })
  if (error) throw new Error(error.message)
  return data as RedeemResult
}

// ---------- 数据导出（数据主权硬性约定） ----------

export async function exportAllData() {
  const [profiles, subjects, checkins, ledger, wishes, redemptions] = await Promise.all([
    db.from('profiles').select('*'),
    db.from('subjects').select('*'),
    db.from('checkins').select('*').order('date', { ascending: true }),
    db.from('star_ledger').select('*').order('created_at', { ascending: true }),
    db.from('wishes').select('*'),
    db.from('wish_redemptions').select('*').order('created_at', { ascending: true }),
  ])
  for (const r of [profiles, subjects, checkins, ledger, wishes, redemptions]) {
    if (r.error) throw new Error(r.error.message)
  }
  return {
    exported_at: new Date().toISOString(),
    profiles: profiles.data || [],
    subjects: subjects.data || [],
    checkins: checkins.data || [],
    star_ledger: ledger.data || [],
    wishes: wishes.data || [],
    wish_redemptions: redemptions.data || [],
  }
}
