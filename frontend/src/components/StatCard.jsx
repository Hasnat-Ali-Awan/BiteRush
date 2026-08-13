export default function StatCard({ label, value, change, icon, suffix }) {
  const up = typeof change === 'number' && change >= 0

  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="mb-3 flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
          {label}
        </p>
        <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold tracking-tight text-on-surface">
        {value}
        {suffix ? <span className="text-lg"> {suffix}</span> : null}
      </p>
      {typeof change === 'number' ? (
        <p
          className={`mt-2 text-sm font-medium ${up ? 'text-success' : 'text-error'}`}
        >
          {up ? '+' : ''}
          {change}% vs yesterday
        </p>
      ) : (
        <p className="mt-2 text-sm text-on-surface-variant">{change}</p>
      )}
    </div>
  )
}
