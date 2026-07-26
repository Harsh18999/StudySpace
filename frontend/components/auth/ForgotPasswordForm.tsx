"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle, Send } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { FloatingInput } from "./SignInForm";

interface Props {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      addToast("Enter a valid email address", "error");
      return;
    }
    setLoading(true);
    // Simulated — backend endpoint not yet implemented
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[#78716C] hover:text-[#0D9488] font-bold mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Sign In
      </button>

      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center mb-4 border border-[#0D9488]/20">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">Reset password</h2>
              <p className="text-[#78716C] text-sm mt-1">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FloatingInput
                id="forgot-email"
                label="Email address"
                type="email"
                icon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
              />
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="ripple w-full py-3 rounded-2xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white font-bold text-sm shadow-md shadow-[#0D9488]/20 hover:from-[#0F766E] hover:to-[#115E59] flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Reset Link</>
                )}
              </motion.button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">Check your inbox</h3>
              <p className="text-[#78716C] text-sm mt-1">
                We&apos;ve sent a reset link to <strong>{email}</strong>
              </p>
            </div>
            <button
              onClick={onBack}
              className="text-sm text-[#0D9488] font-bold hover:text-[#0F766E] transition-colors"
            >
              Return to Sign In
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
