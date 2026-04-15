export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-5 w-32 bg-muted/50 rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted/30 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-muted/30 animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-muted/30 animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-muted/30 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex-1 glass rounded-2xl p-5 space-y-2">
              <div className="h-3 w-16 bg-muted/40 rounded animate-pulse" />
              <div className="h-6 w-24 bg-muted/50 rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="border-t border-border/50" />

        <div className="space-y-3">
          <div className="h-5 w-24 bg-muted/40 rounded animate-pulse" />
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-border/50">
              <div className="w-9 h-9 rounded-full bg-muted/40 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-28 bg-muted/50 rounded animate-pulse" />
                <div className="h-3 w-20 bg-muted/30 rounded animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-muted/40 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
