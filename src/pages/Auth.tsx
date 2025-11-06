import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, User, Shield, ArrowLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

interface AuthProps {
  onClose?: () => void;
  isModal?: boolean;
}

export default function Auth({ onClose, isModal = false }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'user' | 'admin'>('user');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser, registerUser, loginAdmin } = useApp();
  const location = useLocation();

  const handleBack = () => {
    if (isModal && onClose) {
      onClose();
    } else if (!isModal) {
      navigate('/');
    } else {
      window.history.back();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        // Login
        if (userType === 'admin') {
          await loginAdmin(formData.email, formData.password);
          toast.success("Admin login successful!");
          navigate('/admin/dashboard');
        } else {
          await loginUser(formData.email, formData.password);
          toast.success("Login successful!");
          navigate('/');
        }
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        await registerUser(formData.email, formData.password, formData.displayName);
        toast.success(`Welcome to BrainHints, ${formData.displayName}!`);
        navigate('/');
      }
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = isModal 
    ? "w-full px-3 py-2 border border-gray-200 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
    : "w-full px-4 py-3 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2";
    
  const labelClasses = "block text-sm font-medium text-gray-900 mb-2";
  const buttonClasses = isModal 
    ? "w-full py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 text-sm"
    : "w-full py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all duration-300 disabled:opacity-50";

  const content = (
    <div className={`w-full ${isModal ? 'max-w-[380px]' : 'max-w-md'} mx-auto`}>
      <div className={`${isModal ? 'bg-white border border-gray-200 rounded-lg p-6' : 'bg-white border border-gray-200 rounded-2xl p-8 shadow-soft'}`}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative">
            {/* Back Button - Only for non-modal mode */}
            {!isModal && (
              <button
                onClick={handleBack}
                className="absolute left-0 top-0 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back</span>
              </button>
            )}
            
            <div className={`${isModal ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <User className={`${isModal ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />
            </div>
          </div>
          <h2 className={`${isModal ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Sign in to your account' : 'Join our community'}
          </p>
        </div>

        {/* User Type Selector - Only for Login */}
        {isLogin && (
          <div className="mb-6">
            <label className={labelClasses}>Account Type</label>
            <div className="relative bg-gray-50 border border-gray-200 rounded-xl p-1">
              <div className="grid grid-cols-2 gap-1 relative">
                {/* Sliding background */}
                <div
                  className={`absolute top-1 bottom-1 w-1/2 bg-emerald-500 rounded-lg transition-all duration-300 ease-out ${
                    userType === 'user' ? 'translate-x-0' : 'translate-x-full'
                  }`}
                />
                
                <button
                  type="button"
                  onClick={() => setUserType('user')}
                  className={`relative z-10 p-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    userType === 'user'
                      ? 'text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <User className="h-4 w-4 mx-auto mb-1" />
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('admin')}
                  className={`relative z-10 p-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    userType === 'admin'
                      ? 'text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Shield className="h-4 w-4 mx-auto mb-1" />
                  Admin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className={labelClasses} htmlFor="displayName">Full Name</label>
              <div className="relative">
                <User className={`absolute ${isModal ? 'left-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
                <input
                  id="displayName"
                  type="text"
                  required={!isLogin}
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className={`${inputClasses} pl-10`}
                  placeholder="Enter your full name"
                />
              </div>
            </div>
          )}

          <div>
            <label className={labelClasses} htmlFor="email">Email Address</label>
            <div className="relative">
              <Mail className={`absolute ${isModal ? 'left-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={`${inputClasses} pl-10`}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses} htmlFor="password">Password</label>
            <div className="relative">
              <Lock className={`absolute ${isModal ? 'left-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className={`${inputClasses} pl-10`}
                placeholder="Enter your password"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className={labelClasses} htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <Lock className={`absolute ${isModal ? 'left-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
                <input
                  id="confirmPassword"
                  type="password"
                  required={!isLogin}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className={`${inputClasses} pl-10`}
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={buttonClasses}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Test Credentials */}
        {isLogin && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">Test Credentials:</p>
            {userType === 'admin' ? (
              <>
                <p className="text-sm text-blue-700">Admin: admin@gmail.com</p>
                <p className="text-sm text-blue-700">Password: 12345678</p>
              </>
            ) : (
              <>
                <p className="text-sm text-blue-700">User: user@gmail.com</p>
                <p className="text-sm text-blue-700">Password: 123456</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return content;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center py-12 px-4">
      {content}
    </div>
  );
}