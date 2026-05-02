import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Smartphone,
  User,
  ChevronLeft,
  Briefcase,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api'; // Use local service instead of raw axios
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import logo from '../../assets/images/logo.png';
import { normalizeIdentifier } from '../../utils/auth';

/**
 * AdminRegister.tsx
 * One-time system initialization page for creating the first Admin.
 */
const AdminRegister: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    national_id: '',
    password: '',
    confirm_password: '',
    preferred_language: 'English'
  });

  // Check Admin Existence on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Corrected URL: api instance already handles baseURL (/v1)
        const response: any = await api.get('/auth/admin-exists');
        if (response.data.exists) {
          setAdminExists(true);
          setTimeout(() => navigate('/auth/login'), 5000);
        }
      } catch (err) {
        console.error('Failed to check admin status');
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [navigate]);

  // Validation Logic
  const validation = {
    phone: /^(?:\+251|0)(9|7)\d{8}$/.test(form.phone_number),
    national_id: /^\d{12}$/.test(form.national_id),
    password_len: form.password.length >= 8,
    password_match: form.password !== '' && form.password === form.confirm_password,
    password_strength: {
      upper: /[A-Z]/.test(form.password),
      lower: /[a-z]/.test(form.password),
      number: /[0-9]/.test(form.password),
      special: /[^A-Za-z0-9]/.test(form.password)
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminExists) return;
    
    setSubmitting(true);
    setServerError(null);

    try {
      // Normalize inputs
      const payload = {
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_number: form.phone_number.trim().replace(/\s/g, ''),
        email: form.email ? form.email.trim().toLowerCase() : null,
        national_id: form.national_id.trim()
      };

      // Use standard api service
      const response: any = await api.post('/auth/admin-register', payload);
      
      // Axios interceptor in api.ts returns response.data directly
      if (response.success) {
        setSuccess(true);
        setTimeout(() => navigate('/auth/login'), 4000);
      }
    } catch (err: any) {
      // Interceptor returns response.data or error.message
      const msg = (typeof err === 'string') 
        ? err 
        : (err.message || err.error || 'Initialization failed. Please try again.');
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Loader2 size={48} className="text-primary animate-spin" />
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Checking System Status...</p>
        </div>
      </div>
    );
  }

  if (adminExists && !success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl">
            <ShieldAlert size={56} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900">{t('auth.admin_exists_error') || 'System Ready'}</h2>
            <p className="text-slate-500 font-medium">
              Administrator already initialization is complete. One-time setup is closed.
            </p>
          </div>
          <Link to="/auth/login" className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
             <ChevronLeft size={16} /> Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl p-2">
              <img src={logo} alt="EthioHome" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tighter">EthioHome</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">System Initialization</h1>
          <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full w-fit mx-auto text-[10px] font-black uppercase tracking-widest border border-amber-100">
             <ShieldCheck size={14} />
             Create First Administrator
          </div>
        </div>

        <div className="flex justify-center mb-8">
           <LanguageSwitcher />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 sm:p-12 border border-slate-50 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div 
                key="setup-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="bg-amber-50/50 border-l-4 border-amber-400 p-4 rounded-r-2xl">
                   <p className="text-amber-800 text-[11px] font-bold leading-relaxed">
                      CAUTION: This setup can only be performed once to bootstrap the system.
                   </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {serverError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
                       <AlertCircle size={20} />
                       {serverError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InputField label="First Name" name="first_name" icon={<User size={18} />} value={form.first_name} onChange={handleInputChange} />
                    <InputField label="Last Name" name="last_name" icon={<User size={18} />} value={form.last_name} onChange={handleInputChange} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InputField label="Phone Number" name="phone_number" icon={<Smartphone size={18} />} value={form.phone_number} placeholder="09xx xxx xxx" onChange={handleInputChange} error={form.phone_number !== '' && !validation.phone ? 'Invalid Number' : ''} />
                    <InputField label="Email Address" name="email" type="email" icon={<Mail size={18} />} value={form.email} placeholder="admin@ethiohome.com" onChange={handleInputChange} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InputField label="National ID (12 Digits)" name="national_id" icon={<Briefcase size={18} />} value={form.national_id} placeholder="123456789012" onChange={handleInputChange} error={form.national_id !== '' && !validation.national_id ? 'Must be 12 digits' : ''} />
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{t('auth.preferred_language')}</label>
                       <select name="preferred_language" value={form.preferred_language} onChange={handleInputChange} className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white outline-none font-bold text-sm appearance-none cursor-pointer">
                          <option value="English">English 🇬🇧</option>
                          <option value="Amharic">Amharic 🇪🇹</option>
                       </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                    <InputField label="Password" name="password" type="password" icon={<Lock size={18} />} value={form.password} onChange={handleInputChange} />
                    <InputField label="Confirm Password" name="confirm_password" type="password" icon={<Lock size={18} />} value={form.confirm_password} onChange={handleInputChange} error={validation.password_match === false ? 'No match' : ''} />
                  </div>

                  <button type="submit" disabled={submitting || adminExists} className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50">
                    {submitting ? <Loader2 className="animate-spin" /> : (
                      <>
                        <ShieldCheck size={20} />
                        Initial System Setup
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center space-y-8">
                <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                   <CheckCircle2 size={56} strokeWidth={2.5} />
                </div>
                <div className="space-y-3">
                   <h2 className="text-3xl font-black text-slate-900">Success!</h2>
                   <p className="text-slate-500 font-medium">Administrator created. Redirecting to login...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const InputField = ({ label, name, type = 'text', icon, value, onChange, placeholder, error }: any) => (
  <div className="space-y-2">
    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder || `Enter ${label}`} className={`w-full pl-12 pr-4 py-4 rounded-2xl border bg-slate-50 focus:bg-white outline-none transition-all font-bold text-sm ${error ? 'border-red-500' : 'border-slate-100 focus:border-primary'}`} />
    </div>
    {error && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-1">{error}</p>}
  </div>
);

export default AdminRegister;
