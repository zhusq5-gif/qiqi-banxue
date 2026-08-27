import avatars from '../content/avatars.json'

export default function Avatar({ id, size = 64 }: { id: string; size?: number }) {
  const a = avatars.find((x) => x.id === id) || avatars[0]
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`头像 ${a.id}`}>
      <circle cx="50" cy="50" r="48" fill={a.color} />
      <text x="50" y="56" fontSize="52" textAnchor="middle" dominantBaseline="middle">
        {a.emoji}
      </text>
    </svg>
  )
}
