"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Award,
  Clock,
  BookOpen,
  FileText,
  CreditCard,
  FileQuestion,
  TrendingUp,
  Target,
  Bell,
  Sparkles,
  AlertTriangle,
  Calendar as CalendarIcon,
  Zap,
  Layers,
  Brain,
  Activity,
  CheckCircle,
  Circle,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { useAuthStore } from "@/store/useStore";
import { useStudySessionTracker } from "@/hooks/useStudySessionTracker";

const flashcardDonutData = [
  { name: "Mastered", value: 520, color: "#0D9488" },
  { name: "Learning", value: 220, color: "#3B82F6" },
  { name: "Reviewed Today", value: 140, color: "#10B981" },
  { name: "Difficult", value: 80, color: "#F59E0B" },
];

const weakTopics = [
  { name: "Dynamic Programming", confidence: 45, mistakeRate: "38%" },
  { name: "Bayes Theorem", confidence: 52, mistakeRate: "32%" },
  { name: "CNN Architecture", confidence: 58, mistakeRate: "28%" },
];

const studyTasks = [
  { text: "Revise Graph Algorithms & Shortest Path", due: "Tomorrow", done: true },
  { text: "Complete CNN Architecture & Backprop Quiz", due: "Friday", done: false },
  { text: "Watch Lecture 12: Variational Autoencoders", due: "Sunday", done: true },
];

const aiInsights = [
  "💡 You perform best between 8:00 PM and 10:00 PM with 92% retention rate.",
  "⚡ You retain Flashcards 34% better than static Notes.",
  "⚠️ Graphs & Dynamic Programming remain your weakest topic areas.",
  "🎯 Review CNN Architecture within 2 days to prevent memory decay.",
  "🔥 Attempt 1 quiz today to maintain your study streak!",
];

const achievements = [
  { icon: Trophy, title: "100 Hours Studied", desc: "Dedicated Scholar", bg: "bg-amber-500/10 border-amber-500/20 text-amber-600" },
  { icon: Flame, title: "Active Streak", desc: "Unstoppable", bg: "bg-orange-500/10 border-orange-500/20 text-orange-600" },
  { icon: Layers, title: "1000 Flashcards", desc: "Memory Master", bg: "bg-teal-500/10 border-teal-500/20 text-teal-600" },
  { icon: Brain, title: "Quiz Master", desc: "Top Accuracy", bg: "bg-purple-500/10 border-purple-500/20 text-purple-600" },
  { icon: Zap, title: "Fast Learner", desc: "Top 5% Speed", bg: "bg-blue-500/10 border-blue-500/20 text-blue-600" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function AnalyticsDashboardPage() {
  const { user } = useAuthStore();
  const userName = user?.name || "Learner";

  // WebSocket Study Session Tracker (updates active session duration every 30s)
  const { duration: liveSessionSeconds, isConnected } = useStudySessionTracker();

  // State for Learning Progress Trend timeframe: 7, 30, 90 days
  const [daysOption, setDaysOption] = useState<7 | 30 | 90>(30);

  // State for Heatmap View month/year
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Real backend Queries
  const { data: reportTags } = useQuery({
    queryKey: ["reportTags"],
    queryFn: () => dashboardApi.getReportTags().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: learningProgress = [] } = useQuery({
    queryKey: ["learningProgress", daysOption],
    queryFn: () => dashboardApi.getLearningProgress(daysOption).then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: moduleProgressData } = useQuery({
    queryKey: ["moduleProgress"],
    queryFn: () => dashboardApi.getModuleProgress().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: heatMapData = [] } = useQuery({
    queryKey: ["heatmap", selectedMonth, selectedYear],
    queryFn: () => dashboardApi.getHeatMap(selectedMonth, selectedYear).then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: quizPerfData } = useQuery({
    queryKey: ["quizPerformance"],
    queryFn: () => dashboardApi.getQuizPerformance().then((r) => r.data),
    refetchInterval: 30000,
  });

  // Extract module items
  const modulesList = useMemo(() => {
    if (Array.isArray(moduleProgressData)) return moduleProgressData;
    return moduleProgressData?.results || [];
  }, [moduleProgressData]);

  // Extract quiz performance items
  const quizList = useMemo(() => {
    if (Array.isArray(quizPerfData)) return quizPerfData;
    return quizPerfData?.results || [];
  }, [quizPerfData]);

  // Greeting based on current time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Compute total days in month for heatmap grid
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedMonth, selectedYear]);

  // Heatmap dictionary for quick lookup by date string YYYY-MM-DD
  const heatmapDict = useMemo(() => {
    const map: Record<string, number> = {};
    if (Array.isArray(heatMapData)) {
      heatMapData.forEach((item: { date: string; hours: number }) => {
        if (item.date) map[item.date] = item.hours;
      });
    }
    return map;
  }, [heatMapData]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Convert live session seconds to formatted MM:SS or HH:MM:SS
  const formatLiveDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAF7F2] text-[#1C1917] p-4 md:p-8 space-y-8 scroll-thin">
      {/* ── TOP HEADER SECTION ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#FFFDF9] p-6 md:p-8 rounded-3xl border border-[#E6E0D6] shadow-xs">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1C1917] tracking-tight heading-font">
              {greeting}, {userName} 👋
            </h1>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100/80 border border-orange-200 text-orange-700 text-xs font-bold shadow-2xs">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-bounce" />{" "}
              {reportTags?.streaks ?? 0} Day Streak
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-teal-100/80 border border-teal-200 text-[#0D9488] text-xs font-bold shadow-2xs">
              <Award className="w-3.5 h-3.5" /> Best Streak: {reportTags?.best_streaks ?? 0} Days
            </span>
          </div>

          <p className="text-xs md:text-sm font-medium text-[#78716C] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#0D9488]" /> Current Progress:{" "}
            <span className="font-semibold text-[#1C1917]">
              {reportTags?.completed_items ?? 0} of {reportTags?.total_items ?? 0} tasks completed ({reportTags?.progress_percentage ?? 0}%)
            </span>
          </p>

          {/* Progress bar */}
          <div className="max-w-md space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#78716C]">
              <span>Overall Mastery</span>
              <span className="text-[#0D9488]">{reportTags?.progress_percentage ?? 0}%</span>
            </div>
            <div className="w-full h-2.5 bg-[#F5EFE6] border border-[#E6E0D6] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#0D9488] to-[#10B981] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${reportTags?.progress_percentage ?? 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Right Session Status & Live Tracker Header */}
        <div className="flex items-center gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#E6E0D6]">
          <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E6E0D6] text-right space-y-0.5">
            <div className="flex items-center gap-1.5 justify-end">
              {isConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span className="text-[11px] font-bold text-emerald-700">Live Session Active</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-[11px] font-bold text-stone-500">Session Paused</span>
                </>
              )}
            </div>
            <p className="text-xs font-extrabold text-[#0D9488] font-mono">
              {formatLiveDuration(liveSessionSeconds)}
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#1C1917]">{todayStr}</p>
            <p className="text-[11px] text-[#78716C]">Dashboard Overview</p>
          </div>

          <button className="relative p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#E6E0D6] text-[#78716C] hover:text-[#1C1917] hover:border-[#0D9488] transition-all">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
          </button>
        </div>
      </div>

      {/* ── ROW 1: QUICK STATS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { icon: Clock, label: "Total Hours", val: `${reportTags?.total_hours ?? 0} hrs`, change: "Total", color: "text-[#0D9488] bg-teal-50" },
          { icon: BookOpen, label: "Resources", val: reportTags?.resources ?? 0, change: "Total", color: "text-blue-600 bg-blue-50" },
          { icon: FileText, label: "AI Notes", val: reportTags?.notes ?? 0, change: "Saved", color: "text-emerald-600 bg-emerald-50" },
          { icon: CreditCard, label: "Flashcards", val: reportTags?.flashcards ?? 0, change: "Decks", color: "text-indigo-600 bg-indigo-50" },
          { icon: FileQuestion, label: "Quizzes", val: reportTags?.quizzes ?? 0, change: "Created", color: "text-purple-600 bg-purple-50" },
          { icon: TrendingUp, label: "Avg Accuracy", val: `${reportTags?.average_accuracy ?? 100}%`, change: "Score", color: "text-amber-600 bg-amber-50" },
          { icon: Flame, label: "Streak", val: `${reportTags?.streaks ?? 0} Days`, change: `Best: ${reportTags?.best_streaks ?? 0}`, color: "text-orange-600 bg-orange-50" },
        ].map((stat, idx) => {
          const IconComp = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -3 }}
              className="bg-[#FFFDF9] p-4 rounded-2xl border border-[#E6E0D6] shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-base font-extrabold text-[#1C1917] heading-font leading-tight">{stat.val}</p>
                <p className="text-[11px] font-semibold text-[#78716C] truncate mt-0.5">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── TOP SECTION (50% / 50% SPLIT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 50% Column: Learning Progress Trend (7, 30, 90 Days options) */}
        <div className="lg:col-span-6 bg-[#FFFDF9] p-6 md:p-8 rounded-3xl border border-[#E6E0D6] shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1C1917] heading-font flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#0D9488]" /> Learning Progress Trend
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">Study hours logged over selected timeframe.</p>
            </div>

            {/* 3 Options: 7, 30, 90 days */}
            <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E6E0D6] self-start sm:self-auto">
              {([7, 30, 90] as const).map((days) => (
                <button
                  key={days}
                  onClick={() => setDaysOption(days)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    daysOption === days
                      ? "bg-[#0D9488] text-white shadow-2xs"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {learningProgress.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#78716C] border border-dashed border-[#E6E0D6] rounded-2xl">
                No study sessions logged for the last {daysOption} days yet. Start studying to view trends!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={learningProgress}>
                  <defs>
                    <linearGradient id="learningGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#A8A29E" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A8A29E" fontSize={11} tickLine={false} axisLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1C1917",
                      borderColor: "#27272A",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`${val} hours`, "Duration"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#0D9488"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#learningGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right 50% Column: Subject Completion Progress */}
        <div className="lg:col-span-6 bg-[#FFFDF9] p-6 md:p-8 rounded-3xl border border-[#E6E0D6] shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#1C1917] heading-font flex items-center gap-2">
              <Target className="w-5 h-5 text-[#0D9488]" /> Subject Completion Progress
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">Mastery and quiz completion per module.</p>
          </div>

          <div className="flex-1 space-y-4 max-h-72 overflow-y-auto scroll-thin pr-1">
            {modulesList.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-[#78716C] border border-dashed border-[#E6E0D6] rounded-2xl">
                No active subjects/modules created yet. Create a space and module to view progress.
              </div>
            ) : (
              modulesList.map((m: any) => {
                const pct = m.progress_percentage ?? 0;
                return (
                  <div key={m.id || m.module_name} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6E0D6] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1C1917]">
                      <span>{m.module_name}</span>
                      <span className="text-[#0D9488]">{m.completed} / {m.total} Quizzes ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#E6E0D6] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#0D9488] to-[#10B981] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION (2 COLUMNS: HEATMAP & QUIZ PERFORMANCE) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Month-wise Heatmap View */}
        <div className="lg:col-span-6 bg-[#FFFDF9] p-6 md:p-8 rounded-3xl border border-[#E6E0D6] shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1C1917] heading-font flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#0D9488]" /> Month-wise Activity Heatmap
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">Daily study activity logged in {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.</p>
            </div>

            {/* Month & Year Selectors */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl border border-[#E6E0D6] bg-[#FAF7F2] hover:bg-[#F5EFE6] text-[#1C1917]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-[#1C1917] min-w-[90px] text-center">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl border border-[#E6E0D6] bg-[#FAF7F2] hover:bg-[#F5EFE6] text-[#1C1917]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Calendar Grid */}
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-[#78716C]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-1">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const monthStr = String(selectedMonth).padStart(2, "0");
                const dayStr = String(dayNum).padStart(2, "0");
                const dateKey = `${selectedYear}-${monthStr}-${dayStr}`;
                const hoursLogged = heatmapDict[dateKey] || 0;

                let colorBg = "bg-[#FAF7F2] border-[#E6E0D6] text-[#A8A29E]";
                if (hoursLogged > 0 && hoursLogged < 1) colorBg = "bg-teal-100 border-teal-200 text-[#0D9488]";
                else if (hoursLogged >= 1 && hoursLogged < 3) colorBg = "bg-teal-300/80 border-teal-400 text-[#0F766E]";
                else if (hoursLogged >= 3) colorBg = "bg-[#0D9488] border-teal-600 text-white font-bold";

                return (
                  <div
                    key={dayNum}
                    title={`${dateKey}: ${hoursLogged} hours studied`}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-between h-14 transition-all hover:scale-105 ${colorBg}`}
                  >
                    <span className="text-xs">{dayNum}</span>
                    {hoursLogged > 0 && (
                      <span className="text-[10px] font-bold">
                        {hoursLogged}h
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#78716C] border-t border-[#E6E0D6] pt-3">
            <span>No session</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#FAF7F2] border border-[#E6E0D6]" />
              <span className="w-3 h-3 rounded-md bg-teal-100 border border-teal-200" />
              <span className="w-3 h-3 rounded-md bg-teal-300/80 border border-teal-400" />
              <span className="w-3 h-3 rounded-md bg-[#0D9488]" />
            </div>
            <span>High activity</span>
          </div>
        </div>

        {/* Right Column: Quiz Performance by Topic */}
        <div className="lg:col-span-6 bg-[#FFFDF9] p-6 md:p-8 rounded-3xl border border-[#E6E0D6] shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#1C1917] heading-font flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-[#0D9488]" /> Quiz Performance by Topic
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">Average score vs Highest score per module topic.</p>
          </div>

          <div className="h-64 w-full">
            {quizList.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#78716C] border border-dashed border-[#E6E0D6] rounded-2xl">
                No quiz attempts recorded yet. Take a quiz to analyze topic performance!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quizList}>
                  <XAxis dataKey="module" stroke="#A8A29E" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A8A29E" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1C1917",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="avg" fill="#0D9488" radius={[6, 6, 0, 0]} name="Average Score %" />
                  <Bar dataKey="max" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Highest Score %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── SECONDARY / STATIC WIDGETS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Flashcards Retention Breakdown */}
        <div className="lg:col-span-4 bg-[#FFFDF9] p-6 md:p-8 rounded-3xl border border-[#E6E0D6] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#1C1917] heading-font flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#0D9488]" /> Flashcards Retention
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">Spaced repetition breakdown.</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={flashcardDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {flashcardDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1C1917",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            {flashcardDonutData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[#78716C] truncate">{d.name}:</span>
                <span className="font-bold text-[#1C1917]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Weak Topics */}
        <div className="lg:col-span-4 bg-[#FFFDF9] p-6 md:p-8 rounded-3xl border border-amber-200 bg-amber-50/20 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-amber-900 heading-font flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Weak Topics Detected
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
              Review
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {weakTopics.map((topic) => (
              <div
                key={topic.name}
                className="p-3 rounded-2xl bg-[#FFFDF9] border border-amber-200/80 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#1C1917] truncate">{topic.name}</p>
                  <p className="text-[11px] text-[#78716C]">
                    Confidence: <strong className="text-amber-700">{topic.confidence}%</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Learning Insights */}
        <div className="lg:col-span-4 bg-gradient-to-br from-[#1C1917] to-[#2A2421] p-6 md:p-8 rounded-3xl text-white shadow-md flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold heading-font flex items-center gap-2 text-teal-400">
              <Sparkles className="w-4 h-4 text-teal-400 fill-teal-400" /> AI Insights
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold">
              Live
            </span>
          </div>

          <div className="space-y-2 text-xs text-stone-300 flex-1">
            {aiInsights.slice(0, 3).map((insight, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="leading-relaxed">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
