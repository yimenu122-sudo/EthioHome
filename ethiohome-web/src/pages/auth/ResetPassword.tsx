import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Lock, 
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  Smartphone,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import logo from '../../assets/images/logo.png';

/**
 * EthioHome Reset Password Page
 * Combined OTP verification and new password setting
 */
const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Identifier from previous page navigation
  const identifier = location.state?.identifier || '';

  // Form States
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password Validation Logic
  const validation = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    mismatch: confirmPassword !== '' && password !== confirmPassword
  };

  const strength = Object.values(validation).filter(v => v === true && typeof v === 'boolean').length * 20;

  useEffect(() => {
    if (!identifier) {
      // If no identifier context, redirect back
      navigate('/auth/forgot-password');
    }
  }, [identifier, navigate]);

  // Handle OTP Input
  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setServerError(t('auth.errors.invalid_otp_length') || 'Please enter the complete 6-digit code');
      return;
    }

    if (strength < 100 || validation.mismatch) return;

    setIsLoading(true);
    setServerError(null);

    try {
      const response: any = await api.post('/auth/reset-password', {
        identifier,
        otp: otpCode,
        newPassword: password
      });

      if (response.success) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/auth/login');
        }, 4000);
      }
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      const msg = (typeof error === 'string') 
        ? error 
        : (error.message || error.error || t('auth.errors.reset_failed'));
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl p-2 overflow-hidden">
              <img src={logo} alt="EthioHome" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tighter">EthioHome</span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 mb-2">{t('auth.reset_password_title') || 'Reset Password'}</h1>
          <p className="text-slate-500 font-medium">
             {t('auth.reset_instruction')} <span className="text-slate-900 font-bold">{identifier}</span>
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <LanguageSwitcher />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 sm:p-10 border border-slate-50 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="reset-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <form onSubmit={handleSubmit} className="space-y-8">
                  {serverError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
                      <AlertCircle size={20} className="shrink-0" />
                      <span>{serverError}</span>
                    </div>
                  )}

                  {/* Section 1: OTP Code */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                       <Smartphone size={14} />
                       <span>{t('auth.enter_6_digit_otp') || 'Verification Code'}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                       {otp.map((digit, index) => (
                         <input
                           key={index}
                           ref={(el) => (inputRefs.current[index] = el)}
                           type="text"
                           inputMode="numeric"
                           maxLength={1}
                           value={digit}
                           onChange={(e) => handleOtpChange(e.target.value, index)}
                           onKeyDown={(e) => handleKeyDown(e, index)}
                           className="w-full aspect-square text-center text-2xl font-black rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-inner"
                         />
                       ))}
                    </div>
                  </div>

                  {/* Section 2: New Password */}
                  <div className="space-y-5 pt-4 border-t border-slate-50">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">
                        {t('auth.label_new_password') || 'New Password'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock size={20} />
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>

                      {/* Strength Requirements Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 px-1">
                         <Requirement label={t('auth.pass_req_len') || '8+ Characters'} met={validation.length} />
                         <Requirement label={t('auth.pass_req_upper') || 'Uppercase'} met={validation.upper} />
                         <Requirement label={t('auth.pass_req_lower') || 'Lowercase'} met={validation.lower} />
                         <Requirement label={t('auth.pass_req_num') || 'Numbers'} met={validation.number} />
                         <Requirement label={t('auth.pass_req_spec') || 'Special'} met={validation.special} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">
                        {t('auth.label_confirm_password') || 'Confirm Password'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock size={20} />
                        </span>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full pl-12 pr-4 py-4 rounded-2xl border bg-slate-50 focus:bg-white focus:ring-4 outline-none transition-all font-medium ${
                            validation.mismatch ? 'border-red-500 focus:ring-red-500/5' : 'border-slate-100 focus:border-primary focus:ring-primary/5'
                          }`}
                        />
                      </div>
                      {validation.mismatch && (
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1">{t('auth.error_pass_mismatch') || 'Passwords do not match'}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || strength < 100 || validation.mismatch || otp.some(d => d === '')}
                    className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                      <>
                        <ShieldCheck size={20} />
                        {t('auth.reset_password_btn') || 'Update Password & Access Account'}
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-8"
              >
                <div className="relative mx-auto w-24 h-24">
                   <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
                   <div className="w-24 h-24 bg-green-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-green-200 z-10 relative">
                     <CheckCircle2 size={56} strokeWidth={2.5} />
                   </div>
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-900 mb-2">{t('auth.reset_success_title') || 'Password Updated!'}</h3>
                   <p className="text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
                     {t('auth.reset_success_msg') || 'Your password has been securely reset. You will be redirected to the login page shortly.'}
                   </p>
                </div>
                <div className="flex gap-2 justify-center">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Link */}
        <div className="text-center mt-8">
           <Link to="/auth/forgot-password" className="text-slate-400 hover:text-primary transition-colors text-sm font-bold">
              {t('auth.resend_code_request') || 'Didn\'t receive code? Request again'}
           </Link>
        </div>
      </motion.div>
    </div>
  );
};

const Requirement = ({ label, met }: { label: string, met: boolean }) => (
  <div className="flex items-center gap-2">
    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${met ? 'bg-green-500' : 'bg-slate-100'}`}>
       {met ? <Check size={10} className="text-white" strokeWidth={4} /> : <div className="w-1 h-1 bg-slate-300 rounded-full" />}
    </div>
    <span className={`text-[9px] font-black uppercase tracking-tight ${met ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
  </div>
);

export default ResetPassword;
