import { useState } from 'react'
import avatars from '../content/avatars.json'
import Avatar from '../components/Avatar'
import { createProfile } from '../lib/cloudbase'

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [avatarId, setAvatarId] = useState(avatars[0].id)
  const [birthday, setBirthday] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!name.trim()) { setMsg('请填写昵称'); return }
    if (!birthday) { setMsg('请选择生日'); return }
    setBusy(true)
    try {
      await createProfile({ name: name.trim(), avatar_id: avatarId, birthday })
      onDone()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6">
      <h1 className="mb-1 text-2xl font-bold">建立宝贝的小档案</h1>
      <p className="mb-6 text-sm text-stone-500">第一步，选一个喜欢的形象吧</p>

      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg">
        <div className="mb-6 grid grid-cols-4 gap-3">
          {avatars.map((a) => (
            <button
              key={a.id}
              className={`flex flex-col items-center rounded-2xl p-2 transition ${
                avatarId === a.id ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-stone-50'
              }`}
              onClick={() => setAvatarId(a.id)}
            >
              <Avatar id={a.id} size={56} />
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-stone-600">宝贝昵称</label>
        <input
          className="mb-4 h-14 w-full rounded-2xl border border-stone-200 bg-amber-50/50 px-4 text-lg outline-none focus:border-amber-400"
          placeholder="例如：七七"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="block text-sm font-medium text-stone-600">生日</label>
        <input
          type="date"
          className="mb-6 h-14 w-full rounded-2xl border border-stone-200 bg-amber-50/50 px-4 text-lg outline-none focus:border-amber-400"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
        />

        <button
          className="h-14 w-full rounded-2xl bg-amber-500 text-lg font-bold text-white shadow active:scale-[0.98] disabled:opacity-50"
          disabled={busy}
          onClick={save}
        >
          开始使用
        </button>
        {msg && <p className="mt-4 text-center text-sm text-red-500">{msg}</p>}
      </div>
    </div>
  )
}
