/**
 * @file src/screens/LoginScreen.tsx
 * @description Screen 1: Luxury login screen with private banking aesthetic,
 * Indian phone input, and 6-digit mock OTP verification.
 */

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { ShieldCheck, ArrowRight, RefreshCw, Terminal, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onOpenTerminal: () => void;
  externalOtp?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onOpenTerminal,
  externalOtp,
}) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [dispatchedOtp, setDispatchedOtp] = useState<string | null>(null);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  // If user clicked "Autofill OTP" from terminal drawer
  useEffect(() => {
    if (externalOtp && externalOtp.length === 6 && step === 'otp') {
      const digits = externalOtp.split('');
      setOtp(digits);
      handleVerifyOtp(externalOtp);
    }
  }, [externalOtp, step]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setPhone(clean);
    if (error) setError(null);
  };

  const handleUseDemo = () => {
    setPhone('9876543210');
    if (error) setError(null);
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Indian phone numbers must start with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.requestOtp(phone);
      setStep('otp');
      setCountdown(60);
      setCanResend(false);
      if (res.debugOtp) {
        setDispatchedOtp(res.debugOtp);
      }
      setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (error) setError(null);

    if (digit && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    const fullCode = newOtp.join('');
    if (fullCode.length === 6 && !newOtp.includes('')) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split('');
      setOtp(digits);
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const finalOtp = codeToVerify || otp.join('');
    if (finalOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.verifyOtp(phone, finalOtp);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-[#0c0e14] text-zinc-100 select-none">
      {/* Top Bar / Branding */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1px] shadow-lg shadow-amber-500/10">
              <div className="w-full h-full rounded-2xl bg-zinc-950 flex items-center justify-center font-['Playfair_Display'] font-black text-amber-300 text-lg">
                ML
              </div>
            </div>
            <div>
              <span className="font-['Playfair_Display'] font-bold text-white text-lg tracking-wide block leading-none">
                MiniLedger
              </span>
              <span className="text-[10px] font-medium tracking-widest text-amber-300/80 uppercase">
                Private Lending
              </span>
            </div>
          </div>

          <button
            onClick={onOpenTerminal}
            title="Open Server Logs Terminal"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 text-xs font-medium transition"
          >
            <Terminal size={12} className="text-amber-400" />
            Console
          </button>
        </div>

        {/* Step 1: Phone input */}
        {step === 'phone' ? (
          <div>
            <div className="mb-6">
              <h2 className="font-['Playfair_Display'] text-2xl font-bold text-white tracking-tight">
                Access Your Ledger
              </h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Enter your mobile number to authorize your private ledger session via instant mock verification.
              </p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                  Mobile Number
                </label>
                <div className="flex items-center border border-white/[0.12] rounded-2xl overflow-hidden focus-within:border-amber-400/80 focus-within:ring-2 focus-within:ring-amber-400/20 transition bg-zinc-900/60 backdrop-blur-md">
                  <div className="flex items-center gap-1.5 px-3.5 py-3.5 border-r border-white/[0.08] bg-white/[0.03] text-zinc-300 font-bold text-sm">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="flex-1 px-4 py-3.5 text-base font-semibold text-white bg-transparent outline-none placeholder:text-zinc-600 tracking-wide"
                    autoFocus
                  />
                </div>
              </div>

              {/* Demo Account Quick Pill */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-zinc-500 text-[11px]">Instant evaluation:</span>
                <button
                  type="button"
                  onClick={handleUseDemo}
                  className="font-semibold text-amber-300 hover:text-amber-200 text-xs transition"
                >
                  Use Demo (+91 98765 43210)
                </button>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 disabled:opacity-30 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition transform active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Dispatching Code...
                  </>
                ) : (
                  <>
                    Request Verification Code
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: OTP verification */
          <div>
            <div className="mb-6">
              <h2 className="font-['Playfair_Display'] text-2xl font-bold text-white tracking-tight">
                Enter Secure Code
              </h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Verification code dispatched to server console for{' '}
                <span className="font-semibold text-amber-300">+91 {phone}</span>.
              </p>
            </div>

            {/* Luxury Mock OTP Dispatch Box */}
            {dispatchedOtp && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/30 text-zinc-100 shadow-xl shadow-amber-500/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-amber-400" />
                    Mock SMS Terminal Dispatch
                  </span>
                  <span className="text-[10px] text-zinc-400">5m validity</span>
                </div>
                <div className="text-xs text-zinc-300 mb-3 flex items-center justify-between">
                  <span>Authorized OTP:</span>
                  <span className="font-mono font-black text-xl tracking-[0.25em] text-amber-300 bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-600/40">
                    {dispatchedOtp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtp(dispatchedOtp.split(''));
                    handleVerifyOtp(dispatchedOtp);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs tracking-wide shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  ⚡ One-Click Instant Sign In
                </button>
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <div className="flex justify-between gap-2 mb-6" onPaste={handlePasteOtp}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className={`w-12 h-14 rounded-2xl border text-center text-xl font-bold font-mono transition outline-none ${
                    digit
                      ? 'border-amber-400 bg-zinc-900/90 text-amber-200 ring-2 ring-amber-400/20'
                      : 'border-white/[0.1] bg-zinc-900/40 text-white focus:border-amber-400 focus:bg-zinc-900'
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={loading || otp.join('').length !== 6}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 disabled:opacity-30 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Verifying Session...
                </>
              ) : (
                <>
                  Authorize & Unlock Ledger
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Resend / Change Phone Footer */}
            <div className="mt-5 flex items-center justify-between text-xs text-zinc-400 font-medium">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp(['', '', '', '', '', '']);
                  setError(null);
                }}
                className="hover:underline text-zinc-400 hover:text-white"
              >
                ← Change Number
              </button>

              <button
                type="button"
                disabled={!canResend || loading}
                onClick={() => handleRequestOtp()}
                className={`font-semibold ${
                  canResend ? 'text-amber-400 hover:underline' : 'text-zinc-600'
                }`}
              >
                {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security & Disclaimer Footer */}
      <div className="mt-8 pt-4 border-t border-white/[0.05] text-center">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
          <ShieldCheck size={13} className="text-amber-400/80" />
          <span>Encrypted Session • Mock SMS Environment</span>
        </div>
      </div>
    </div>
  );
};
