"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useStore";
import { IconSidebar } from "@/components/dashboard/IconSidebar";
import { StudySessionProvider } from "@/hooks/useStudySessionTracker";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem("access_token")) {
      router.replace("/auth");
    }
  }, [isAuthenticated, router]);

  return (
    <StudySessionProvider>
      <div className="flex h-screen overflow-hidden bg-[#FAF7F2] text-[#1C1917]">
        {/* 80px fixed icon sidebar */}
        <IconSidebar />

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">{children}</div>
      </div>
    </StudySessionProvider>
  );
}
