import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Smartphone,
  Check,
  RotateCcw,
  Lock,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import logo from '../../assets/images/logo.png';

/**
 * Enterprise-Level Verification Page
 * Supports: Registration Verification & Login 2FA
 */
const Verify: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setAuthUser } = useAuthStore();

  // Extraction of state from navigation
  const flowType = location.state?.type || 'registration'; // 'registration' | '2fa'
  const identifier = location.state?.phone || location.state?.email || location.state?.identifier || '';
  const userId = location.state?.userId || null;

  // Refs for OTP inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Core State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  // Security & Timer State
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const MAX_ATTEMPTS = 5;

  // Initial redirect if no identifier is present
  useEffect(() => {
    if (!identifier && !userId) {
      navigate('/auth/login');
    }
  }, [identifier, userId, navigate]);

  // Timer Logic
  useEffect(() => {
    let timer: any;
    if (countdown > 0 && !isSuccess) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown, isSuccess]);

  // Handle OTP Input Change
  const handleOtpChange = (value: string, index: number) => {
    if (isLocked || isSuccess) return;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if complete
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (code?: string) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== 6 || isLocked || isLoading) return;

    setIsLoading(true);
    setServerError(null);

    try {
      // Determine endpoint based on flow
      const endpoint = flowType === 'registration' 
        ? '/auth/verify-account' 
        : '/auth/login/verify';

      const response: any = await api.post(endpoint, {
        userId,
        identifier,
        otp: otpCode,
        flow: flowType
      });

      if (response.success) {
        setIsSuccess(true);
        
        // Finalize Login if it was 2FA or if registration returns a token
        const authData = response.data || response;
        if (authData.user && authData.token) {
          const { user, token } = authData;
          // Set token in localStorage for the api interceptor
          localStorage.setItem('ethiohome_token', token);
          setAuthUser(user);
          
          // Delayed redirect based on role
          setTimeout(() => {
            switch (user.role) {
              case 'Admin': navigate('/admin/dashboard'); break;
              case 'Agent': navigate('/agent/dashboard'); break;
              case 'Owner': navigate('/owner/dashboard'); break;
              case 'Renter': navigate('/renter/home'); break;
              case 'Buyer': navigate('/buyer/home'); break;
              default: navigate('/');
            }
          }, 2000);
        } else {
          // Registration success flow (redirect to login)
          setTimeout(() => navigate('/auth/login'), 3000);
        }
      }
    } catch (error: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setServerError(t('auth.errors.too_many_attempts') || 'Too many attempts. Your account has been temporarily locked for security.');
      } else {
        setServerError(error.response?.data?.message || t('auth.errors.invalid_otp'));
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isLocked || isLoading) return;
    
    setIsLoading(true);
    setServerError(null);
    try {
      await api.post('/auth/otp/resend', { 
        userId, 
        identifier,
        type: flowType 
      });
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      const msg = typeof error === 'string' ? error : (error.message || error.error || t('auth.errors.resend_failed'));
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Masking the identifier for privacy
  const maskedIdentifier = identifier.includes('@') 
    ? identifier.replace(/(.{2})(.*)(?=@)/, (gp1: string, gp2: string, gp3: string) => gp2 + '*'.repeat(gp3.length))
    : identifier.replace(/(\+\d{3})(\d{3})(\d{2})/, '$1***$3');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
           <Link to="/" className="inline-flex items-center gap-2 mb-6">
             <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 p-2 overflow-hidden">
                <img src={logo} alt="EthioHome Logo" className="w-full h-full object-contain" />
             </div>
             <span className="text-2xl font-black text-slate-800 tracking-tighter">EthioHome</span>
           </Link>
           <h1 className="text-3xl font-black text-slate-900 mb-2">
             {flowType === 'registration' ? t('auth.verify_title') : t('auth.verify_identity_title') || 'Two-Step Verification'}
           </h1>
           <p className="text-slate-500 font-medium">
             {t('auth.otp_sent_to')} <span className="text-slate-900 font-bold">{maskedIdentifier}</span>
           </p>
        </div>

        {/* Translation Toggle */}
        <div className="flex justify-center mb-6">
          <LanguageSwitcher />
        </div>

        {/* Card Component */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 sm:p-10 border border-slate-50 text-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="verify-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Flow Icon */}
                <div className="flex justify-center">
                   <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border transition-colors shadow-inner ${
                     isLocked ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-50 text-primary border-slate-100'
                   }`}>
                      {isLocked ? <ShieldAlert size={40} /> : <ShieldCheck size={40} />}
                   </div>
                </div>

                {/* Error Pulse */}
                {serverError && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold text-left"
                  >
                    <AlertCircle size={20} className="shrink-0" />
                    <span>{serverError}</span>
                  </motion.div>
                )}

                {/* OTP Input Grid */}
                <div className="space-y-4">
                  <div className="flex justify-between gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        disabled={isLocked || isLoading}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className={`w-full aspect-square text-center text-3xl font-black rounded-2xl border-2 outline-none transition-all shadow-inner 
                          ${isLocked 
                            ? 'bg-red-50/50 border-red-100 text-red-300' 
                            : digit 
                              ? 'bg-white border-primary text-primary ring-4 ring-primary/5' 
                              : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 text-slate-900'
                          }`}
                      />
                    ))}
                  </div>
                  
                  {/* Security Indicators */}
                  {!isLocked && (
                    <div className="flex justify-center gap-1">
                      {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1 w-4 rounded-full transition-colors ${i < attempts ? 'bg-red-500' : 'bg-slate-200'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Resend & Actions */}
                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    {countdown > 0 ? (
                      <div className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                         <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                         {t('auth.resend_otp_in')} <span className="text-primary font-black tabular-nums">{countdown}s</span>
                      </div>
                    ) : (
                      <button 
                        onClick={handleResend}
                        disabled={isLocked || isLoading}
                        className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50 group"
                      >
                        <RotateCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                        {t('auth.resend_otp')}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleSubmit()}
                    disabled={isLocked || isLoading || otp.some(d => d === '')}
                    className={`w-full py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 
                      ${isLocked ? 'bg-slate-300 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark shadow-primary/20'}`}
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                      <>
                        <ShieldCheck size={20} />
                        {t('auth.verify_account')}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Success Animation / State */
              <motion.div
                key="success-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 space-y-8"
              >
                <div className="flex flex-col items-center justify-center gap-8">
                   <div className="relative">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                        className="w-24 h-24 bg-green-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-green-200 z-10 relative"
                      >
                         <Check size={48} strokeWidth={4} />
                      </motion.div>
                      <motion.div 
                         animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                         transition={{ duration: 1.5, repeat: Infinity }}
                         className="absolute inset-0 bg-green-500 rounded-[2rem]"
                      />
                   </div>
                   <div className="space-y-2">
                      <h2 className="text-3xl font-black text-slate-900">{t('auth.verified_title')}</h2>
                      <p className="text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
                        {flowType === '2fa' 
                          ? t('auth.login_success_msg') || 'Identity confirmed. Accessing your dashboard...'
                          : t('auth.verified_subtitle')}
                      </p>
                   </div>
                   
                   {/* Loader for redirect */}
                   <div className="flex gap-1.5 justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Support Footer */}
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
            <Link 
              to={flowType === 'registration' ? "/auth/register" : "/auth/login"} 
              className="text-slate-400 hover:text-primary transition-colors text-sm font-bold flex items-center gap-2"
            >
              <ChevronLeft size={18} />
              {flowType === 'registration' ? t('auth.back_to_register') : t('common.back_to_login') || 'Back to Login'}
            </Link>
            
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
               Need help? Contact <a href="mailto:support@ethiohome.com" className="text-primary hover:underline">Support</a>
            </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Verify;
