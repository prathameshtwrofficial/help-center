import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      if (formData.email === "admin@gmail.com" && formData.password === "12345678") {
        navigate("/admin/dashboard");
      } else {
        setError("Invalid credentials. Try admin@gmail.com / 12345678");
      }
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-1">
      <div className="w-full max-w-[180px] bg-card border border-border rounded-lg p-1 shadow-soft">
        
        {/* Header */}
        <div className="text-center mb-1">
          <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-0.5">
            <Shield className="h-2 w-2 text-white" />
          </div>
          <h2 className="text-xs font-bold text-foreground">Admin</h2>
        </div>

        {/* Credentials */}
        <div className="bg-blue-50 border border-blue-200 rounded p-0.5 mb-1">
          <p className="text-[8px] text-blue-800">admin@gmail.com</p>
          <p className="text-[8px] text-blue-800">12345678</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-0.5 py-0.5 rounded mb-1 text-[8px]">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-1">
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-1 py-0.5 border border-input bg-background rounded text-[8px] focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="Email"
          />
          
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-1 py-0.5 border border-input bg-background rounded text-[8px] focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="Password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-0.5 bg-red-600 text-white font-bold rounded text-[8px] hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}