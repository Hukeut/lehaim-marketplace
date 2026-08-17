import Link from "next/link";
import BottomNav from "./BottomNav";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fbf9f5] flex justify-center">
      <div className="w-full max-w-sm px-4 pt-6 pb-32">
        {/* Bandeau de stand-by : cette page est l'ancienne maquette, conservée pour référence */}
        <Link
          href="/ecrans"
          className="mb-4 flex items-center gap-2 rounded-2xl bg-[#00113a] px-4 py-3 text-xs font-semibold text-white"
        >
          <span aria-hidden="true">‹</span>
          Ancienne maquette · revenir à Lehaim v2
        </Link>

        {/* Top bar */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#efeeea] ring-2 ring-black/5">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop"
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-2xl font-bold italic text-[#002366]">
              Lehaim
            </span>
          </div>

          <button className="p-2 rounded-full text-[#002366] hover:bg-[#f5f3ef]">
            🔔
          </button>
        </header>

        {/* Welcome */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-[#00113a] mb-2">
            Hello Michael
          </h1>
          <p className="text-[#444650] text-base">
            Discover upcoming Shabbat events
          </p>
        </section>

        {/* Search */}
        <section className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>
            <input
              type="text"
              placeholder="Find a dinner, class, or community..."
              className="w-full pl-11 pr-4 py-4 bg-[#eae8e4] rounded-2xl border-none outline-none"
            />
          </div>

          <button className="bg-[#00113a] text-white px-4 rounded-2xl">
            ⚙️
          </button>
        </section>

        {/* Chips */}
        <section className="mb-10 flex gap-3 overflow-x-auto">
          <button className="shrink-0 px-5 py-2.5 bg-[#002366] text-white rounded-full text-sm font-semibold">
            This weekend
          </button>
          <button className="shrink-0 px-5 py-2.5 bg-[#eae8e4] text-[#444650] rounded-full text-sm font-medium">
            Under ₪100
          </button>
          <button className="shrink-0 px-5 py-2.5 bg-[#eae8e4] text-[#444650] rounded-full text-sm font-medium">
            Torah class
          </button>
          <button className="shrink-0 px-5 py-2.5 bg-[#eae8e4] text-[#444650] rounded-full text-sm font-medium">
            Shomer Shabbat
          </button>
          <button className="shrink-0 px-5 py-2.5 bg-[#eae8e4] text-[#444650] rounded-full text-sm font-medium">
            English Speaking
          </button>
        </section>

        {/* Popular */}
        <section className="mb-12">
          <div className="flex justify-between items-end mb-5">
            <h2 className="text-2xl font-bold text-[#00113a]">
              Popular this week
            </h2>
            <button className="text-[#002366] text-sm font-bold underline underline-offset-4">
              View all
            </button>
          </div>

          <div className="space-y-5">
            {/* Big card */}
            <div className="relative rounded-3xl overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1200&auto=format&fit=crop"
                alt="Shabbat Dinner"
                className="w-full h-72 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#00113a] via-[#00113a]/30 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <div className="flex gap-2 mb-3 flex-wrap">
                  <span className="bg-[#ffa049] text-[#6e3a00] px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                    Traditional
                  </span>
                  <span className="bg-[#ffe088] text-[#241a00] px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                    Kosher Mehadrin
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  Shabbat Dinner in Florentin
                </h3>

                <div className="text-white/90 text-sm space-y-1">
                  <p>📅 Friday, 19:30</p>
                  <p>📍 Tel Aviv</p>
                  <p>👥 4 spots left</p>
                </div>
              </div>
            </div>

            {/* Secondary card */}
            <div className="relative rounded-3xl overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1200&auto=format&fit=crop"
                alt="Torah Class"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#00113a] via-[#00113a]/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <span className="bg-[#cca830] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase inline-block mb-3">
                  Learning
                </span>
                <h3 className="text-xl font-bold text-white mb-2">
                  Philosophy & Wine
                </h3>
                <p className="text-white/80 text-sm mb-3">
                  A deep dive into Chassidic thought in a relaxed atmosphere.
                </p>
                <span className="text-white font-bold text-lg">₪80</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recommended */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-[#00113a] mb-5">
            Recommended for you
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-2">
            <div className="shrink-0 w-72 bg-white rounded-3xl overflow-hidden shadow-md">
              <div className="relative h-44">
                <img
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop"
                  alt="Rooftop"
                  className="w-full h-full object-cover"
                />
                <button className="absolute top-4 right-4 bg-white/30 backdrop-blur px-2 py-1 rounded-full text-white">
                  ❤️
                </button>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[#904d00] font-bold text-[10px] uppercase tracking-wider">
                    Social Dinner
                  </span>
                  <span className="bg-[#efeeea] px-2 py-0.5 rounded text-[10px] font-bold">
                    ₪150
                  </span>
                </div>
                <h4 className="text-lg font-bold text-[#00113a] mb-2 leading-tight">
                  Rooftop Kiddush & Cocktails
                </h4>
                <p className="text-xs text-[#444650]">📍 Jerusalem, Old City</p>
              </div>
            </div>

            <div className="shrink-0 w-72 bg-white rounded-3xl overflow-hidden shadow-md">
              <div className="relative h-44">
                <img
                  src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop"
                  alt="Meditation"
                  className="w-full h-full object-cover"
                />
                <button className="absolute top-4 right-4 bg-white/30 backdrop-blur px-2 py-1 rounded-full text-white">
                  ❤️
                </button>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[#904d00] font-bold text-[10px] uppercase tracking-wider">
                    Soulful Morning
                  </span>
                  <span className="bg-[#efeeea] px-2 py-0.5 rounded text-[10px] font-bold">
                    Free
                  </span>
                </div>
                <h4 className="text-lg font-bold text-[#00113a] mb-2 leading-tight">
                  Shabbat Morning Meditation
                </h4>
                <p className="text-xs text-[#444650]">📍 Haifa, Bahai Area</p>
              </div>
            </div>

            <div className="shrink-0 w-72 bg-white rounded-3xl overflow-hidden shadow-md">
              <div className="relative h-44">
                <img
                  src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop"
                  alt="Nature walk"
                  className="w-full h-full object-cover"
                />
                <button className="absolute top-4 right-4 bg-white/30 backdrop-blur px-2 py-1 rounded-full text-white">
                  ❤️
                </button>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[#904d00] font-bold text-[10px] uppercase tracking-wider">
                    Outdoor
                  </span>
                  <span className="bg-[#efeeea] px-2 py-0.5 rounded text-[10px] font-bold">
                    ₪40
                  </span>
                </div>
                <h4 className="text-lg font-bold text-[#00113a] mb-2 leading-tight">
                  Post-Shabbat Nature Walk
                </h4>
                <p className="text-xs text-[#444650]">📍 Galilee Region</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}