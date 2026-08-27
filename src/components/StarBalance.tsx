export default function StarBalance({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-1.5 shadow-md">
      <span className="text-2xl leading-none">⭐</span>
      <span className="text-2xl font-bold tabular-nums text-amber-600">{value}</span>
    </div>
  )
}
