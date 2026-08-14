export function Loader() {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4 w-full h-full min-h-[40vh]">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 border-2 border-border rounded-full"></div>
        <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      <span className="text-sm font-medium opacity-60 animate-pulse tracking-wide">
        Loading...
      </span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <Loader />
    </div>
  );
}
