"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { loginSchema, registerSchema, LoginFormData, RegisterFormData } from "@/lib/validations/auth";

export default function AuthForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [serverError, setServerError] = useState("");

  // Dynamic form hook based on current state
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<any>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
  });

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setServerError("");
    reset(); // Clear errors when switching modes
  };

  const onSubmit = async (data: any) => {
    setServerError("");
    
    if (isLogin) {
      const loginData = data as LoginFormData;
      const result = await signIn("credentials", {
        redirect: false,
        email: loginData.email,
        password: loginData.password,
      });
      
      if (result?.error) {
        setServerError("Invalid credentials. Please try again.");
      } else {
        onSuccess();
      }
    } else {
      const registerData = data as RegisterFormData;
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerData),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          setServerError(errorData.message || "Registration failed. Surveyor ID or Email may exist.");
        } else {
          // Auto-login after successful registration
          await signIn("credentials", { redirect: false, email: registerData.email, password: registerData.password });
          onSuccess();
        }
      } catch (err) {
        setServerError("A network error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#111814] p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md border border-[#1c2b23]/10 dark:border-white/10 max-h-[90vh] overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-[#1c2b23] dark:text-white">
          {isLogin ? "Surveyor Portal Login" : "Register Cadastral Profile"}
        </h3>
        <p className="text-[13px] text-[#1c2b23]/60 dark:text-white/60 mt-1 font-medium">
          {isLogin ? "Access your GIS workspace." : "Request access to the BhuMap platform."}
        </p>
      </div>
      
      {serverError && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-[13px] font-medium mb-5 border border-red-100 dark:border-red-900/30">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {!isLogin && (
          <>
            <div>
              <label className="text-[12px] font-bold text-[#1c2b23] dark:text-white/80 uppercase tracking-wide">Full Name</label>
              <input {...register("fullName")} className="w-full mt-1.5 bg-[#f4f8f5] dark:bg-[#2a3630] text-[#1c2b23] dark:text-white px-4 py-2.5 rounded-xl border border-transparent focus:border-[#5b8c69] outline-none transition-all text-[14px]" placeholder="e.g. Anil Kumar" />
              {errors.fullName && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.fullName.message as string}</p>}
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[12px] font-bold text-[#1c2b23] dark:text-white/80 uppercase tracking-wide">Surveyor ID</label>
                <input {...register("surveyorId")} className="w-full mt-1.5 bg-[#f4f8f5] dark:bg-[#2a3630] text-[#1c2b23] dark:text-white px-4 py-2.5 rounded-xl border border-transparent focus:border-[#5b8c69] outline-none transition-all text-[14px]" placeholder="SUR-2026" />
                {errors.surveyorId && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.surveyorId.message as string}</p>}
              </div>
              <div className="flex-1">
                <label className="text-[12px] font-bold text-[#1c2b23] dark:text-white/80 uppercase tracking-wide">Department</label>
                <input {...register("department")} className="w-full mt-1.5 bg-[#f4f8f5] dark:bg-[#2a3630] text-[#1c2b23] dark:text-white px-4 py-2.5 rounded-xl border border-transparent focus:border-[#5b8c69] outline-none transition-all text-[14px]" placeholder="UP Land Records" />
                {errors.department && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.department.message as string}</p>}
              </div>
            </div>
          </>
        )}

        <div>
          <label className="text-[12px] font-bold text-[#1c2b23] dark:text-white/80 uppercase tracking-wide">Official Email</label>
          <input {...register("email")} className="w-full mt-1.5 bg-[#f4f8f5] dark:bg-[#2a3630] text-[#1c2b23] dark:text-white px-4 py-2.5 rounded-xl border border-transparent focus:border-[#5b8c69] outline-none transition-all text-[14px]" placeholder="surveyor@state.gov.in" />
          {errors.email && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.email.message as string}</p>}
        </div>

        <div>
          <label className="text-[12px] font-bold text-[#1c2b23] dark:text-white/80 uppercase tracking-wide">Password</label>
          <input type="password" {...register("password")} className="w-full mt-1.5 bg-[#f4f8f5] dark:bg-[#2a3630] text-[#1c2b23] dark:text-white px-4 py-2.5 rounded-xl border border-transparent focus:border-[#5b8c69] outline-none transition-all text-[14px]" placeholder="••••••••" />
          {errors.password && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.password.message as string}</p>}
        </div>

        <button 
          disabled={isSubmitting}
          className="w-full bg-[#5b8c69] text-white font-bold py-3.5 rounded-xl hover:bg-[#4a7258] transition-all mt-3 disabled:opacity-70 shadow-md shadow-[#5b8c69]/20"
        >
          {isSubmitting ? "Processing..." : isLogin ? "Secure Login" : "Submit Registration"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#1c2b23]/5 dark:border-white/5 text-center">
        <button onClick={toggleAuthMode} className="text-[13px] text-[#5b8c69] hover:text-[#4a7258] transition-colors font-semibold">
          {isLogin ? "New Surveyor? Request access here." : "Already registered? Login to workspace."}
        </button>
      </div>
    </div>
  );
}