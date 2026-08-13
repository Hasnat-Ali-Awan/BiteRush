import { useId } from 'react'

export default function BiteRushLogo({
  size = 40,
  showWordmark = true,
  compact = false,
}) {
  const uid = useId().replace(/:/g, '')
  const gradId = `brLogoGrad-${uid}`

  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 drop-shadow-sm"
      >
        <defs>
          <linearGradient
            id={gradId}
            x1="10"
            y1="6"
            x2="56"
            y2="58"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FF7A1A" />
            <stop offset="0.55" stopColor="#E85D04" />
            <stop offset="1" stopColor="#C74E03" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill={`url(#${gradId})`} />
        <path
          d="M16.5 33.5c0-7.4 6.2-12.5 13.8-12.5 5.2 0 9.7 2.3 12.1 5.9-2.1 1.3-3.5 3.5-3.5 6.1 0 1.5.5 2.9 1.3 4H18.2c-1-.9-1.7-2.1-1.7-3.5Z"
          fill="#FFF7F0"
        />
        <path
          d="M18.2 37h21.1c.9 0 1.6.7 1.6 1.6v1.1c0 .9-.7 1.6-1.6 1.6H18.2c-.9 0-1.6-.7-1.6-1.6v-1.1c0-.9.7-1.6 1.6-1.6Z"
          fill="#1A1A1A"
        />
        <path
          d="M19 41.3h19.2c1.1 0 2 .8 2 1.9 0 3.8-4.6 6.3-10.6 6.3s-10.6-2.5-10.6-6.3c0-1.1.9-1.9 2-1.9Z"
          fill="#FFF7F0"
        />
        <path
          d="M46 22.5h8.5M48.5 27.5H57M47 32.5h7"
          stroke="#FFF7F0"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>

      {showWordmark ? (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[1.15rem] font-extrabold tracking-tight text-on-surface">
            Bite<span className="text-primary">Rush</span>
          </p>
          {!compact ? (
            <p className="truncate text-xs font-medium text-on-surface-variant">
              Food, fast.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
