export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-background text-foreground min-h-screen p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="flex items-center justify-between pb-6 mb-6 border-b border-border">
        <h1 className="text-3xl font-light tracking-tight">Gym Track</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm transition-opacity hover:opacity-90">
          Sync Data
        </button>
      </header>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-border bg-surface p-4 rounded-lg flex flex-col gap-1">
          <span className="text-sm font-medium opacity-70">Total Workouts</span>
          <span className="text-2xl font-semibold">142</span>
        </div>
        <div className="border border-border bg-surface p-4 rounded-lg flex flex-col gap-1">
          <span className="text-sm font-medium opacity-70">Weekly Streak</span>
          <span className="text-2xl font-semibold">3 weeks</span>
        </div>
        <div className="border border-border bg-surface p-4 rounded-lg flex flex-col gap-1">
          <span className="text-sm font-medium opacity-70">Total Volume</span>
          <span className="text-2xl font-semibold">12,400 kg</span>
        </div>
      </div>

      {/* Tags Demonstration */}
      <section>
        <h2 className="text-lg font-medium mb-4">Muscle Focus (Example Tags)</h2>
        <div className="flex flex-wrap gap-2">
          <span className="bg-tag-blue-bg text-tag-blue-text border border-border px-2 py-1 rounded-sm text-xs font-medium tracking-wide">
            CHEST
          </span>
          <span className="bg-tag-green-bg text-tag-green-text border border-border px-2 py-1 rounded-sm text-xs font-medium tracking-wide">
            LEGS
          </span>
          <span className="bg-tag-red-bg text-tag-red-text border border-border px-2 py-1 rounded-sm text-xs font-medium tracking-wide">
            BACK
          </span>
          <span className="bg-tag-yellow-bg text-tag-yellow-text border border-border px-2 py-1 rounded-sm text-xs font-medium tracking-wide">
            ARMS
          </span>
        </div>
      </section>
    </div>
  );
}
