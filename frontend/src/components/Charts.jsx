export function RevenueChart({ data = [] }) {
  const max = Math.max(...data.map((d) => d.amount), 1)
  const height = 180
  const width = 420
  const padding = 24
  const points = data.map((d, i) => {
    const x =
      padding + (i * (width - padding * 2)) / Math.max(data.length - 1, 1)
    const y = height - padding - (d.amount / max) * (height - padding * 2)
    return `${x},${y}`
  })

  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <h3 className="mb-4 text-lg font-semibold">Revenue (7 days)</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full">
        <polyline
          fill="none"
          stroke="#E85D04"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points.join(' ')}
        />
        {data.map((d, i) => {
          const x =
            padding + (i * (width - padding * 2)) / Math.max(data.length - 1, 1)
          const y =
            height - padding - (d.amount / max) * (height - padding * 2)
          return <circle key={d.date} cx={x} cy={y} r="4" fill="#E85D04" />
        })}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-on-surface-variant">
        {data.map((d) => (
          <span key={d.date}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}

export function PopularDishesChart({ data = [] }) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <h3 className="mb-4 text-lg font-semibold">Popular dishes</h3>
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No dish data yet</p>
        ) : (
          data.map((dish) => (
            <div key={dish.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">{dish.name}</span>
                <span className="text-on-surface-variant">{dish.count}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-container-high">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${(dish.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
