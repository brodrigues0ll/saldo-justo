export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted/40 animate-pulse shrink-0" />
            <div className="h-3 w-24 bg-muted/30 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-9 h-9 rounded-full bg-muted/30 animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-muted/30 animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-muted/30 animate-pulse" />
            <div className="w-9 h-9 rounded-full bg-muted/30 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="h-4 w-24 bg-muted/40 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-muted/50 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted/30 rounded animate-pulse" />
                </div>
                <div className="h-6 w-12 bg-muted/40 rounded animate-pulse" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
                <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
