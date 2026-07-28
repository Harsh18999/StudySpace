"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { authApi, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  onForgot: () => void;
  onSignUp: () => void;
}

export function SignInForm({ onForgot, onSignUp }: Props) {
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { setTokens, setUser } = useAuthStore();
  const router = useRouter();
  const { addToast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setGoogleLoading(true);
    try {
      const res = await authApi.googleLogin(
        tokenResponse.credential,
        tokenResponse.access_token,
        tokenResponse.code
      );
      setTokens(res.data.access, res.data.refresh);

      const profile = await authApi.profile();
      setUser(profile.data);

      setSuccess(true);
      addToast("Signed in with Google! 🎉", "success");

      setTimeout(() => {
        router.push("/dashboard");
      }, 400);
    } catch (err: unknown) {
      setGoogleLoading(false);
      console.error("Google login error:", err);
      const msg = getApiErrorMessage(err, "Google Sign-In failed");
      addToast(msg, "error");
    }
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (error) => {
      console.error("Google login error:", error);
      addToast("Google Sign-In was cancelled or failed", "error");
    },
    flow: "auth-code",
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.login(data.email, data.password);
      setTokens(res.data.access, res.data.refresh);

      // Fetch profile
      const profile = await authApi.profile();
      setUser(profile.data);

      setSuccess(true);
      addToast("Welcome back! 🎉", "success");

      setTimeout(() => {
        router.push("/dashboard");
      }, 400);
    } catch (err: unknown) {
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      console.error("login error:", err);
      const msg = getApiErrorMessage(err, "Invalid email or password");
      addToast(msg, "error");
    }
  };

  return (
    <div className={shake ? "shake" : ""}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">Welcome back</h2>
        <p className="text-[#78716C] text-sm mt-1">Sign in to continue your learning workspace</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Email */}
        <FloatingInput
          id="signin-email"
          label="Email address"
          type="email"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        {/* Password */}
        <div className="relative">
          <FloatingInput
            id="signin-password"
            label="Password"
            type={showPw ? "text" : "password"}
            icon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] transition-colors"
            style={{ marginTop: errors.password ? -10 : 0 }}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("remember")} className="w-4 h-4 accent-[#0D9488] rounded" />
            <span className="text-sm text-[#78716C]">Remember me</span>
          </label>
          <button type="button" onClick={onForgot} className="text-sm text-[#0D9488] font-semibold hover:text-[#0F766E] transition-colors">
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading || googleLoading || success}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="ripple w-full py-3 rounded-2xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white font-bold text-sm shadow-md shadow-[#0D9488]/20 hover:from-[#0F766E] hover:to-[#115E59] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.span key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Signed in!
              </motion.span>
            ) : loading ? (
              <motion.span key="loading" className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
              </motion.span>
            ) : (
              <motion.span key="idle">Sign In</motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-[#E6E0D6]" />
          <span className="text-xs text-[#A8A29E] font-medium">or continue with</span>
          <div className="flex-1 h-px bg-[#E6E0D6]" />
        </div>

        {/* Full-width Google Button */}
        <button
          type="button"
          disabled={googleLoading}
          onClick={() => triggerGoogleLogin()}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-[#E6E0D6] bg-[#FAF7F2] text-xs font-bold text-[#1C1917] hover:bg-[#F5EFE6] hover:border-[#D6CEC0] transition-all disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#0D9488]" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
          )}
          <span>{googleLoading ? "Signing in with Google..." : "Continue with Google"}</span>
        </button>

        <p className="text-center text-sm text-[#78716C] mt-1">
          Don&apos;t have an account?{" "}
          <button type="button" onClick={onSignUp} className="text-[#0D9488] font-bold hover:text-[#0F766E]">
            Create Account
          </button>
        </p>
      </form>
    </div>
  );
}

// ── Floating label input ───────────────────────────────────────
interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
}

export const FloatingInput = ({ id, label, icon, error, ...props }: FloatingInputProps) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <div className={`relative rounded-2xl border transition-all duration-200 ${
        focused
          ? "border-[#0D9488] ring-2 ring-[#0D9488]/15 bg-white"
          : error
          ? "border-red-400 bg-red-50/20"
          : "border-[#E6E0D6] bg-[#FAF7F2]/60"
      }`}>
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716C]">{icon}</div>
        <input
          id={id}
          {...props}
          className="w-full pt-5 pb-2 pl-10 pr-4 text-sm text-[#1C1917] bg-transparent outline-none peer font-medium"
          placeholder=" "
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          onChange={(e) => { setHasValue(!!e.target.value); props.onChange?.(e); }}
        />
        <label
          htmlFor={id}
          className={`absolute left-10 transition-all duration-200 pointer-events-none ${
            focused || hasValue
              ? "text-[10px] top-1.5 text-[#0D9488] font-bold"
              : "text-sm top-1/2 -translate-y-1/2 text-[#78716C]"
          }`}
        >
          {label}
        </label>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-500 pl-1 font-medium"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
