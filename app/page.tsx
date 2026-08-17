"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogoTile, Wordmark } from "@/components/Wordmark";

/** 01 · Splash */
export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace("/onboarding"), 1600);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-center gap-3.5 sm:min-h-0">
      <div className="animate-[var(--animate-pop)] pb-1.5">
        <LogoTile />
      </div>
      <Wordmark className="text-[26px]" />
      <p className="text-[13px] text-ink/50">Chargement de votre Shabbat…</p>
      <Link
        href="/onboarding"
        className="absolute bottom-8 text-[12px] font-bold text-teal"
      >
        Entrer
      </Link>
    </main>
  );
}
