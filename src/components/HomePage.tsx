import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
      <main className="flex flex-col items-center gap-10 px-4">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            聚财通录
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400">
            简洁 · 高效 · 一目了然
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/private-fund"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-8 py-4 text-base font-medium text-white shadow-md transition-all hover:bg-zinc-700 hover:shadow-lg hover:-translate-y-0.5 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            私募基金看板
          </Link>
          <Link
            href="/renovation"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-8 py-4 text-base font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-100 hover:shadow-md hover:-translate-y-0.5 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            装修记账
          </Link>
        </div>
      </main>
    </div>
  );
}
