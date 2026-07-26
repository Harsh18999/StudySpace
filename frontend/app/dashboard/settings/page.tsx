"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  CreditCard,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  History,
  Sparkles,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/useStore";
import { paymentsApi, authApi } from "@/lib/api";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

interface OrderHistory {
  id: number;
  gateway_order_id: string;
  gateway_payment_id?: string;
  amount: number;
  credits: number;
  status: string;
  created_at: string;
}

interface UsageHistory {
  id: number;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

const PRESET_PACKAGES = [
  { id: "starter", name: "Starter", inr: 10, credits: 100, tag: "Basic" },
  { id: "popular", name: "Popular", inr: 50, credits: 500, tag: "Most Popular", popular: true },
  { id: "pro", name: "Pro Pack", inr: 100, credits: 1000, tag: "Best Value" },
];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"profile" | "billing">("billing");
  const [balance, setBalance] = useState<number>(0);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [usages, setUsages] = useState<UsageHistory[]>([]);
  const [selectedInr, setSelectedInr] = useState<number>(50);
  const [customInr, setCustomInr] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingHistory, setFetchingHistory] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check PAYMENTOPTION env variable
  const paymentOptionEnv = (process.env.NEXT_PUBLIC_PAYMENTOPTION || process.env.NEXT_PUBLIC_PAYMENT_OPTION || "DISABLE").toUpperCase();
  const isPaymentEnabled = (paymentOptionEnv === "ENABLE" || paymentOptionEnv === "ENABLED");

  // Load Razorpay Checkout Script if payments enabled
  useEffect(() => {
    if (isPaymentEnabled && typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isPaymentEnabled]);

  // Fetch initial profile & payment history
  const loadPaymentData = async () => {
    setFetchingHistory(true);
    try {
      const [profileRes, historyRes] = await Promise.allSettled([
        authApi.profile(),
        paymentsApi.getHistory(),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value.data) {
        setBalance(profileRes.value.data.wallet ?? 0);
        if (user) {
          setUser({ ...user, name: profileRes.value.data.name, email: profileRes.value.data.email });
        }
      }

      if (historyRes.status === "fulfilled" && historyRes.value.data) {
        setBalance(historyRes.value.data.balance ?? 0);
        setOrders(historyRes.value.data.orders ?? []);
        setUsages(historyRes.value.data.usages ?? []);
      }
    } catch (err) {
      console.error("Failed to load payment data:", err);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    loadPaymentData();
  }, []);

  const handleBuyCredits = async (amountInr: number) => {
    if (!isPaymentEnabled) {
      setAlertMsg({ type: "error", text: "Payments are currently disabled by system configuration (PAYMENTOPTION=DISABLE)." });
      return;
    }

    if (amountInr <= 0) {
      setAlertMsg({ type: "error", text: "Please select a valid amount" });
      return;
    }

    setLoading(true);
    setAlertMsg(null);

    try {
      // 1. Create order on backend
      const res = await paymentsApi.createOrder(amountInr);
      const { order_id, amount, currency, key } = res.data;

      if (!window.Razorpay) {
        setAlertMsg({ type: "error", text: "Razorpay SDK failed to load. Please refresh and try again." });
        setLoading(false);
        return;
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: key,
        amount: amount, // in paise
        currency: currency,
        name: "StudySpace Credits",
        description: `Purchase ${amountInr * 10} Credits`,
        order_id: order_id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#4f46e5",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async function (response: any) {
          try {
            // 3. Verify Payment Signature
            const verifyRes = await paymentsApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setAlertMsg({ type: "success", text: verifyRes.data.message || "Credits added successfully!" });
            loadPaymentData();
          } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setAlertMsg({
              type: "error",
              text: error.response?.data?.message || "Payment verification failed",
            });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setAlertMsg({
        type: "error",
        text: error.response?.data?.message || "Failed to initiate payment. Please try again.",
      });
      setLoading(false);
    }
  };

  const getEffectiveInr = () => {
    if (customInr) {
      const parsed = parseInt(customInr, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return selectedInr;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account profile, credits wallet, and billing settings.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 space-x-6">
        <button
          onClick={() => setActiveTab("billing")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "billing"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Billing & Credits
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "profile"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Profile Details
        </button>
      </div>

      {alertMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
            alertMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {alertMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{alertMsg.text}</span>
        </motion.div>
      )}

      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-xl shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">User Profile</h2>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "SS"}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">{user?.name || "StudySpace User"}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              {user?.phone && <p className="text-xs text-slate-400 mt-0.5">{user?.phone}</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="space-y-8">
          {/* Credit Wallet Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
              <Coins className="w-96 h-96 text-white" />
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold backdrop-blur-md mb-3 border border-indigo-400/20">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Current Balance</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black tracking-tight text-white">{balance}</span>
                  <span className="text-lg font-medium text-indigo-200">Credits</span>
                </div>
                <p className="text-xs text-indigo-300 mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  1 INR = 10 Credits (Used for AI generation & flashcards)
                </p>
              </div>

              <button
                onClick={loadPaymentData}
                disabled={fetchingHistory}
                className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/15 transition-all flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingHistory ? "animate-spin" : ""}`} />
                Refresh Balance
              </button>
            </div>
          </div>

          {/* Top Up Credits Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Buy Credits
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">Select a credit pack to top up your StudySpace wallet instantly.</p>
              </div>
            </div>

            {/* Payment Disabled Banner */}
            {!isPaymentEnabled && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold text-amber-900">Payments Currently Disabled</p>
                  <p className="text-amber-700 font-normal mt-0.5">
                    Online credit purchases are currently turned off (PAYMENTOPTION=DISABLE). Free 500 monthly credits are active.
                  </p>
                </div>
              </div>
            )}

            {/* Credit Packs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {PRESET_PACKAGES.map((pkg) => {
                const isSelected = !customInr && selectedInr === pkg.inr;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      if (isPaymentEnabled) {
                        setSelectedInr(pkg.inr);
                        setCustomInr("");
                      }
                    }}
                    className={`relative rounded-2xl p-5 border-2 transition-all ${
                      !isPaymentEnabled
                        ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-50"
                        : isSelected
                        ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20 cursor-pointer"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm cursor-pointer"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 right-4 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold uppercase rounded-full shadow">
                        {pkg.tag}
                      </span>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-600">{pkg.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-600">
                        ₹{pkg.inr}
                      </span>
                    </div>

                    <div className="text-2xl font-black text-slate-900 mb-1">
                      {pkg.credits}{" "}
                      <span className="text-xs font-normal text-slate-500">Credits</span>
                    </div>
                    <p className="text-xs text-slate-500">₹{(pkg.inr / pkg.credits).toFixed(2)} / credit</p>
                  </div>
                );
              })}
            </div>

            {/* Custom Amount Input */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-700 block mb-1">Custom Top-up (INR)</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    disabled={!isPaymentEnabled}
                    placeholder="e.g. 200"
                    value={customInr}
                    onChange={(e) => setCustomInr(e.target.value)}
                    className="pl-7 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-indigo-600 font-semibold text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {customInr && parseInt(customInr, 10) > 0 && (
                <div className="text-right">
                  <span className="text-xs text-slate-500">You will get:</span>
                  <p className="text-lg font-bold text-indigo-600">
                    {parseInt(customInr, 10) * 10} Credits
                  </p>
                </div>
              )}
            </div>

            {/* Pay Button */}
            <button
              onClick={() => handleBuyCredits(getEffectiveInr())}
              disabled={!isPaymentEnabled || loading || getEffectiveInr() <= 0}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              {!isPaymentEnabled ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Payments Disabled by System Configuration
                </>
              ) : loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay ₹{getEffectiveInr()} for {getEffectiveInr() * 10} Credits
                </>
              )}
            </button>
          </div>

          {/* History Tables */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-600" />
              Transaction History
            </h2>

            <div className="space-y-6">
              {/* Payments History */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Payment Orders</h3>
                {orders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No past payments recorded.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                          <th className="pb-2">Order ID</th>
                          <th className="pb-2">Amount</th>
                          <th className="pb-2">Credits</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.map((o) => (
                          <tr key={o.id} className="hover:bg-slate-50">
                            <td className="py-2.5 font-mono text-slate-600">{o.gateway_order_id}</td>
                            <td className="py-2.5 font-bold text-slate-900">₹{o.amount}</td>
                            <td className="py-2.5 font-semibold text-indigo-600">+{o.credits}</td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                o.status === "success"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : o.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-slate-400">
                              {new Date(o.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Usage History */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Credit Usages</h3>
                {usages.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No credit usage recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                          <th className="pb-2">Description</th>
                          <th className="pb-2">Type</th>
                          <th className="pb-2">Credits</th>
                          <th className="pb-2 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {usages.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="py-2.5 font-medium text-slate-800">{u.description}</td>
                            <td className="py-2.5 text-slate-500 uppercase text-[10px] font-bold">{u.transaction_type}</td>
                            <td className="py-2.5 font-bold text-rose-600">-{u.amount}</td>
                            <td className="py-2.5 text-right text-slate-400">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
