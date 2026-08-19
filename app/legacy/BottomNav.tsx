export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-center">
      <div className="w-full max-w-sm flex justify-around items-center px-4 pb-6 pt-3 bg-[#fbf9f5]/90 backdrop-blur-xl rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,17,58,0.06)] border-t border-black/5">
        <button className="flex flex-col items-center justify-center text-[#002366] bg-[#f5f3ef] rounded-full px-3 py-2 transition active:scale-95">
          <span className="text-lg">🧭</span>
          <span className="text-[10px] font-medium mt-1">Explore</span>
        </button>

        <button className="flex flex-col items-center justify-center text-black/60 p-2 transition active:scale-95">
          <span className="text-lg">📅</span>
          <span className="text-[10px] font-medium mt-1">Bookings</span>
        </button>

        <button className="flex flex-col items-center justify-center text-black/60 p-2 transition active:scale-95">
          <span className="text-2xl leading-none">➕</span>
          <span className="text-[10px] font-medium mt-1">Create</span>
        </button>

        <button className="flex flex-col items-center justify-center text-black/60 p-2 transition active:scale-95">
          <span className="text-lg">👥</span>
          <span className="text-[10px] font-medium mt-1">Community</span>
        </button>

        <button className="flex flex-col items-center justify-center text-black/60 p-2 transition active:scale-95">
          <span className="text-lg">👤</span>
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
}