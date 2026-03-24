// app/(tutor)/layout.tsx
export default function TutorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <main className="max-w-lg mx-auto">{children}</main>
    </div>
  )
}
