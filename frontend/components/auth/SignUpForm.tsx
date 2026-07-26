"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle, ArrowLeft, KeyRound } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { FloatingInput } from "./SignInForm";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v, "You must accept the terms"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  onSignIn: () => void;
}

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "", color: "bg-[#E6E0D6]" },
    { label: "Weak", color: "bg-red-400" },
    { label: "Fair", color: "bg-amber-400" },
    { label: "Good", color: "bg-yellow-400" },
    { label: "Strong", color: "bg-[#0D9488]" },
  ];
  return { score, ...map[score] };
}

export function SignUpForm({ onSignIn }: Props) {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pwValue, setPwValue] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(60);

  const { setTokens, setUser } = useAuthStore();
  const router = useRouter();
  const { addToast } = useToast();

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const strength = getStrength(pwValue);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

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
      addToast("Signed up with Google! 🎉", "success");

      setTimeout(() => {
        router.push("/dashboard");
      }, 400);
    } catch (err: unknown) {
      setGoogleLoading(false);
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Google Sign-Up failed";
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

  // Step 1: Send OTP to user email
  const onSendOtpSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.sendOtp(data.email);
      setLoading(false);
      setStep("otp");
      setResendTimer(60);
      addToast("Verification code sent to your email! 📧", "success");
    } catch (err: unknown) {
      setLoading(false);
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to send verification code";
      addToast(msg, "error");
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    const email = getValues("email");
    if (!email) return;
    setLoading(true);
    try {
      await authApi.sendOtp(email);
      setLoading(false);
      setResendTimer(60);
      addToast("New verification code sent! 📧", "success");
    } catch (err: unknown) {
      setLoading(false);
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to resend code";
      addToast(msg, "error");
    }
  };

  // Step 2: Verify OTP & Complete Registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      addToast("Please enter the 6-digit verification code", "error");
      return;
    }

    const { name, email, password } = getValues();
    setLoading(true);

    try {
      const res = await authApi.register(name, email, password, otpCode.trim());
      setTokens(res.data.access, res.data.refresh);

      const profile = await authApi.profile();
      setUser(profile.data);

      setSuccess(true);
      addToast("Account verified & created! Welcome to StudySpace 🎉", "success");

      setTimeout(() => {
        router.push("/dashboard");
      }, 400);
    } catch (err: unknown) {
      setLoading(false);
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Registration failed. Invalid code.";
      addToast(msg, "error");
    }
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {step === "details" ? (
          <motion.div
            key="step-details"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">Create account</h2>
              <p className="text-[#78716C] text-sm mt-1">Start your learning workspace today</p>
            </div>

            <form onSubmit={handleSubmit(onSendOtpSubmit)} className="flex flex-col gap-4">
              <FloatingInput id="signup-name" label="Full Name" type="text" icon={<User className="w-4 h-4" />} error={errors.name?.message} {...register("name")} />
              <FloatingInput id="signup-email" label="Email address" type="email" icon={<Mail className="w-4 h-4" />} error={errors.email?.message} {...register("email")} />

              {/* Password + strength */}
              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <FloatingInput
                    id="signup-password"
                    label="Password"
                    type={showPw ? "text" : "password"}
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.password?.message}
                    {...register("password", {
                      onChange: (e) => setPwValue(e.target.value),
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength bar */}
                {pwValue.length > 0 && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex-1 flex gap-1 h-1.5">
                      {[1, 2, 3, 4].map((s) => (
                        <div
                          key={s}
                          className={`flex-1 rounded-full transition-all duration-300 ${
                            s <= strength.score ? strength.color : "bg-[#E6E0D6]"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-[#78716C]">{strength.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <FloatingInput
                  id="signup-confirm"
                  label="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  icon={<Lock className="w-4 h-4" />}
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Terms */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" {...register("terms")} className="w-4 h-4 accent-[#0D9488] rounded mt-0.5" />
                  <span className="text-xs text-[#78716C] leading-relaxed">
                    I agree to the{" "}
                    <a href="#" className="text-[#0D9488] font-bold hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-[#0D9488] font-bold hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {errors.terms && <p className="text-xs text-red-500 mt-1 font-medium">{errors.terms.message}</p>}
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading || googleLoading || success}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="ripple w-full py-3 rounded-2xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white font-bold text-sm shadow-md shadow-[#0D9488]/20 hover:from-[#0F766E] hover:to-[#115E59] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending Code…
                  </span>
                ) : (
                  <span>Send Verification Code</span>
                )}
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
                Already have an account?{" "}
                <button type="button" onClick={onSignIn} className="text-[#0D9488] font-bold hover:text-[#0F766E]">
                  Sign In
                </button>
              </p>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="step-otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <button
              type="button"
              onClick={() => setStep("details")}
              className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#0D9488] font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#0D9488]" /> Change Email or Details
            </button>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center mb-3 border border-[#0D9488]/20">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">Verify your email</h2>
              <p className="text-[#78716C] text-xs mt-1 leading-relaxed">
                We sent a 6-digit verification code to <strong className="text-[#1C1917]">{getValues("email")}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerifyAndRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] uppercase tracking-wider">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full py-3.5 px-4 text-center font-mono text-2xl font-extrabold tracking-[8px] text-[#0D9488] bg-[#FAF7F2] border-2 border-[#0D9488]/40 rounded-2xl outline-none focus:border-[#0D9488] focus:ring-4 focus:ring-[#0D9488]/15 transition-all"
                />
              </div>

              {/* Resend Timer Row */}
              <div className="flex items-center justify-between text-xs text-[#78716C]">
                <span>Didn&apos;t receive code?</span>
                {resendTimer > 0 ? (
                  <span className="font-semibold text-[#A8A29E]">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="font-bold text-[#0D9488] hover:text-[#0F766E] underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading || success || otpCode.length !== 6}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="ripple w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white font-bold text-sm shadow-md shadow-[#0D9488]/20 hover:from-[#0F766E] hover:to-[#115E59] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              >
                <AnimatePresence mode="wait">
                  {success ? (
                    <motion.span key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Verified & Creating Account!
                    </motion.span>
                  ) : loading ? (
                    <motion.span key="loading" className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code…
                    </motion.span>
                  ) : (
                    <motion.span key="idle">Verify & Complete Signup</motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
