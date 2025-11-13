// components/flash-sale/hero-banner.tsx
export function HeroBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-orange-500 px-4 pt-8 pb-12">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-yellow-200 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          {/* left */}
          <div className="md:col-span-2">
            <div className="relative overflow-hidden rounded-3xl border-4 border-yellow-300 bg-gradient-to-br from-red-700 to-red-900 p-6 text-white shadow-2xl">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute right-2 top-2 text-5xl">🎁</div>
              </div>
              <div className="relative text-center">
                <div className="mb-3 text-4xl font-black md:text-5xl">
                  <span className="inline-block bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">
                    XỬ LÝ
                  </span>
                </div>
                <div className="rounded-full bg-yellow-300 px-4 py-2 text-xs font-bold text-red-700 shadow-lg md:text-sm">
                  HÀNG SĂN TẠI KHO
                </div>
              </div>
            </div>
          </div>

          {/* right */}
          <div className="grid grid-cols-1 gap-4 md:col-span-3 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border-4 border-cyan-300 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-6 text-white shadow-2xl">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute left-2 top-2 text-4xl">🚀</div>
              </div>
              <div className="relative text-center">
                <div className="text-xl font-bold md:text-2xl">GIAO</div>
                <div className="text-3xl font-black md:text-4xl">NHANH</div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border-4 border-cyan-300 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-6 text-white shadow-2xl">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute bottom-2 right-2 text-4xl">⚡</div>
              </div>
              <div className="relative text-center">
                <div className="text-lg font-bold md:text-xl">GIẢM</div>
                <div className="text-4xl font-black md:text-5xl">50%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
