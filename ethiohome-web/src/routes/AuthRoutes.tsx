import { Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/auth/Login';
import RegisterPage from '../pages/auth/Register';
import VerifyPage from '../pages/auth/Verify';
import ForgotPasswordPage from '../pages/auth/ForgotPassword';
import ResetPasswordPage from '../pages/auth/ResetPassword';
import AdminRegister from '../pages/auth/AdminRegister';

const AuthRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="verify" element={<VerifyPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="admin-register" element={<AdminRegister />} />
    </Routes>
  );
};

export default AuthRoutes;
