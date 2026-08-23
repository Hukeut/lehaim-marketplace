import BottomTabs from "@/components/BottomTabs";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col sm:min-h-0">
      {children}
      <BottomTabs />
    </div>
  );
}
