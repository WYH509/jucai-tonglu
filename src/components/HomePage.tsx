import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50">
      <main className="flex flex-col items-center gap-8 px-6 w-full max-w-2xl">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
            聚财通录
          </h1>
          <p className="text-sm text-zinc-400">
            简洁 · 高效 · 一目了然
          </p>
        </div>

        {/* Big Buttons — mobile: stack, desktop: side-by-side */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          {/* 私募基金看板 */}
          <Link
            href="/private-fund"
            className="group relative flex flex-col justify-between rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 sm:p-8 shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex-1 min-h-[180px] sm:min-h-[200px]"
          >
            <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
              <span className="text-2xl sm:text-3xl">💰</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                私募基金看板
              </h2>
              <p className="text-xs sm:text-sm text-white/80">
                收益 · 净值 · 趋势
              </p>
            </div>
            <span className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 text-white/70 text-lg transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>

          {/* 装修记账 */}
          <Link
            href="/renovation"
            className="group relative flex flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 p-6 sm:p-8 shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex-1 min-h-[180px] sm:min-h-[200px]"
          >
            <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
              <span className="text-2xl sm:text-3xl">🏠</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                装修记账
              </h2>
              <p className="text-xs sm:text-sm text-white/80">
                项目 · 主材 · 进度
              </p>
            </div>
            <span className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 text-white/70 text-lg transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
