import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight,
  Loader2,
  AlertCircle,
  Smartphone,
  ChevronLeft,
  Mail,
  ShieldQuestion,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import logo from '../../assets/images/logo.png';

/**
 * EthioHome Forgot Password Page
 * Features Smart Input (Phone or Email) and Bilingual Support
 */
const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Form States
  const [identifier, setIdentifier] = useState('');
  const [method, setMethod] = useState<'SMS' | 'Email'>('SMS');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  // Smart Detection Logic
  useEffect(() => {
    // Regex for Ethiopian phone numbers
    const phoneRegex = /^(?:\+251|0)[79]\d{8}$/;
    if (identifier.includes('@')) {
      setMethod('Email');
    } else if (phoneRegex.test(identifier) || /^[0-9]+$/.test(identifier)) {
      setMethod('SMS');
    }
  }, [identifier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;

    setIsLoading(true);
    setServerError(null);

    try {
      // Use project api service to ensure base URL and headers are correct
      const response: any = await api.post('/auth/forgot-password', {
        identifier
      });

      if (response.success) {
        setIsSent(true);
        // After 3 seconds, navigate to reset page with the identifier
        setTimeout(() => {
          navigate('/auth/reset-password', { state: { identifier } });
        }, 3000);
      }
    } catch (error: any) {
      console.error('Password Reset Error:', error);
      // Extract specific error message or fallback to localized default
      const msg = (typeof error === 'string') 
        ? error 
        : (error.message || error.error || t('auth.errors.request_failed'));
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo Section */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl p-2 overflow-hidden">
              <img src={logo} alt="EthioHome Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tighter">EthioHome</span>
          </Link>
        </div>

        {/* Translation Switcher */}
        <div className="flex justify-center mb-6">
          <LanguageSwitcher />
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 sm:p-10 border border-slate-50 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!isSent ? (
              <motion.div
                key="request-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">
                    {t('auth.forgot_password_title') || 'Locked Out?'}
                  </h2>
                  <p className="text-slate-500 text-sm font-medium">
                    {t('auth.forgot_password_subtitle') || 'Enter your registered details to recover your account access.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {serverError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
                      <AlertCircle size={18} />
                      {serverError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">
                      {t('auth.identifier_label') || 'Phone or Email'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors">
                         {method === 'SMS' ? <Smartphone size={18} /> : <Mail size={18} />}
                      </span>
                      <input
                        type="text"
                        placeholder={t('auth.identifier_placeholder') || '09xx xxx xxx or email@address.com'}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-slate-900"
                      />
                      {identifier && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${method === 'SMS' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                            {method}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !identifier}
                    className="w-full py-5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        {t('auth.send_otp_btn') || 'Send Recovery Code'}
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
                className="py-10 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                   <CheckCircle2 size={40} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">
                    {t('auth.code_sent_title') || 'Check Your Phone/Email'}
                  </h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    {t('auth.code_sent_msg') || 'We have sent a 6-digit verification code to your account. Redirecting you to reset your password...'}
                  </p>
                </div>
                <div className="flex justify-center gap-1">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse delay-150" />
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse delay-300" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Footer */}
        <div className="text-center mt-8">
          <Link to="/auth/login" className="text-slate-500 hover:text-primary transition-colors text-sm font-bold flex items-center justify-center gap-2">
            <ChevronLeft size={18} />
            {t('auth.back_to_login') || 'Back to Login'}
          </Link>
        </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
