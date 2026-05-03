// Login Page
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import translations from "@/lib/i18n/bn";
import Link from "next/link";
import BackButton from '@/components/common/BackButton';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const t = translations;

  const handleSendOTP = async () => {
    if (!phone) return setError(t.messages.fieldRequired);
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ phone }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      
      setOtpSent(true);
      setMessage("OTP পাঠানো হয়েছে! " + (data.dev_otp ? `(Dev OTP: ${data.dev_otp})` : ""));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn(loginMethod === "email" ? "credentials" : "phone-otp", {
        email: loginMethod === "email" ? email : undefined,
        password: loginMethod === "email" ? password : undefined,
        phone: loginMethod === "phone" ? phone : undefined,
        otp: loginMethod === "phone" ? otp : undefined,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === "Account not approved" ? t.auth.accountPending : t.auth.invalidCredentials);
      } else if (result?.ok) {
        const session = await fetch("/api/auth/session").then(res => res.json());
        const role = session?.user?.role;
        if (role === "MANAGER") router.push("/manager/dashboard");
        else if (role === "ADMIN") router.push("/admin");
        else if (role === "TENANT") router.push("/tenant/dashboard");
        else router.push("/dashboard");
      }
    } catch {
      setError(t.messages.somethingWentWrong);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <BackButton />
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t.auth.loginTitle}
          </h2>
          <div className="mt-4 flex justify-center space-x-4">
            <button 
              onClick={() => { setLoginMethod("email"); setError(""); setMessage(""); }}
              className={`px-4 py-2 text-sm font-medium rounded-md ${loginMethod === "email" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border"}`}
            >
              ইমেইল
            </button>
            <button 
              onClick={() => { setLoginMethod("phone"); setError(""); setMessage(""); }}
              className={`px-4 py-2 text-sm font-medium rounded-md ${loginMethod === "phone" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border"}`}
            >
              ফোন নম্বর
            </button>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="rounded-md bg-red-50 p-4"><p className="text-sm text-red-700">{error}</p></div>}
          {message && <div className="rounded-md bg-green-50 p-4"><p className="text-sm text-green-700">{message}</p></div>}

          <div className="rounded-md shadow-sm -space-y-px">
            {loginMethod === "email" ? (
              <>
                <input
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={t.auth.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={t.auth.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </>
            ) : (
              <>
                <div className="flex">
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder={t.auth.phone}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="ml-2 px-4 py-2 text-xs bg-blue-600 text-white rounded-md whitespace-nowrap"
                    >
                      {t.auth.sendOTP}
                    </button>
                  )}
                </div>
                {otpSent && (
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder={t.auth.otp}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                )}
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || (loginMethod === "phone" && !otpSent)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? t.common.loading : t.auth.login}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t.auth.dontHaveAccount}{" "}
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                {t.auth.signup}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
