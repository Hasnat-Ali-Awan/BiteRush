import BiteRushLogo from './BiteRushLogo'

export default function TopBar() {
  return (
    <header className="fixed left-64 right-0 top-0 z-10 flex h-16 items-center justify-between border-b border-surface-variant/50 bg-surface px-4">
      <div className="flex w-full max-w-3xl items-center gap-4">
        <div className="hidden md:block">
          <BiteRushLogo size={28} compact showWordmark={false} />
        </div>
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="w-full rounded-xl border-none bg-surface-container-low py-2 pl-10 text-base outline-none ring-primary/50 focus:ring-2"
            placeholder="Search orders, dishes..."
            type="search"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-full p-2 text-on-surface-variant transition-opacity hover:bg-surface-container active:opacity-70"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
        </button>
        <div className="hidden h-8 w-px bg-outline-variant/30 sm:block" />
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            M
          </div>
          <span className="hidden text-sm font-semibold lg:block">
            Admin Manager
          </span>
        </div>
      </div>
    </header>
  )
}
