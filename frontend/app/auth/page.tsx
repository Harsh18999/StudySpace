import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Sign In — StudySpace",
  description: "Sign in or create your StudySpace account to start learning.",
};

export default function AuthRoute() {
  return <AuthPage />;
}
