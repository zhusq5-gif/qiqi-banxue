import icons from '../content/icons.json'

export default function SubjectIcon({ id, size = 56 }: { id: string; size?: number }) {
  const i = icons.find((x) => x.id === id) || icons[0]
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`图标 ${i.id}`}>
      <circle cx="50" cy="50" r="48" fill={i.color} />
      <text x="50" y="56" fontSize="46" textAnchor="middle" dominantBaseline="middle">
        {i.emoji}
      </text>
    </svg>
  )
}
