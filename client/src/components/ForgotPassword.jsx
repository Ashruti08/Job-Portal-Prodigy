import React, { useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, X, ArrowLeft } from "lucide-react";
import { useSignIn } from '@clerk/clerk-react';
import { useContext } from "react";

const ClerkForgotPassword = ({ onBack, onClose }) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { signIn, setActive } = useSignIn();
  const { backendUrl, setCompanyToken, setCompanyData } = useContext(AppContext);
  const navigate = useNavigate();

  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    setPasswordStrength(checkPasswordStrength(password));
  };

  // Step 1: Send reset password email
  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Please enter your email address");
      return;
    }

    console.log("=== SENDING RESET EMAIL DEBUG ===");
    console.log("Email:", trimmedEmail);
    console.log("Backend URL:", backendUrl);
    console.log("=================================");

    setIsLoading(true);
    try {
      // First, check if this email belongs to a recruiter in your backend
      console.log("🔍 Checking if email is recruiter...");
      const { data } = await axios.post(`${backendUrl}/api/company/check-recruiter-email`, {
        email: trimmedEmail
      });

      console.log("📊 Check recruiter response:", data);

      if (!data.success || !data.isRecruiter) {
        toast.error(data.message || "This email is not registered as a recruiter account.");
        setIsLoading(false);
        return;
      }

      console.log("✅ Email verified as recruiter, proceeding with Clerk reset...");

      // Check if signIn is available
      if (!signIn) {
        console.error("❌ signIn object is not available");
        toast.error("Authentication service is not available. Please refresh the page and try again.");
        setIsLoading(false);
        return;
      }

      // If it's a recruiter, proceed with Clerk reset
      const result = await signIn.create({
        strategy: "reset_password_email_code",
        identifier: trimmedEmail,
      });
      
      console.log("📧 Clerk reset email result:", result);
      
      toast.success("Reset code sent to your recruiter email!");
      setStep(2);
    } catch (error) {
      console.error("❌ Error sending reset email:", error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.errors && error.errors.length > 0) {
        const clerkError = error.errors[0];
        console.log("🔍 Clerk error:", clerkError);
        
        if (clerkError.code === "form_identifier_not_found") {
          toast.error("This email is not found in our authentication system. Please contact support.");
        } else if (clerkError.code === "form_password_not_supported") {
          toast.error("Password reset is not supported for this account type.");
        } else {
          toast.error(clerkError.longMessage || clerkError.message || "Failed to send reset email");
        }
      } else {
        toast.error("Failed to send reset email. Please try again or contact support.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code and reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    const trimmedCode = code.trim();
    const trimmedPassword = newPassword.trim();
    
    if (!trimmedCode || !trimmedPassword) {
      toast.error("Please enter both verification code and new password");
      return;
    }

    if (trimmedPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(trimmedPassword)) {
      toast.error("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    console.log("=== RESETTING PASSWORD DEBUG ===");
    console.log("Code:", trimmedCode);
    console.log("New password length:", trimmedPassword.length);
    console.log("Password strength:", passwordStrength);
    console.log("===============================");

    setIsLoading(true);
    try {
      // Check if signIn is available
      if (!signIn) {
        console.error("❌ signIn object is not available");
        toast.error("Authentication service is not available. Please refresh the page and try again.");
        setIsLoading(false);
        return;
      }

      console.log("🔄 Attempting password reset with Clerk...");
      
      // First, attempt to reset the password with Clerk
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: trimmedCode,
        password: trimmedPassword,
      });

      console.log("📊 Clerk reset result status:", result.status);
      console.log("📊 Clerk user ID:", result.user?.id);

      if (result.status === "complete") {
        console.log("✅ Clerk password reset successful");
        
        // Verify this is a recruiter account and sync with backend
        try {
          console.log("🔍 Verifying recruiter and syncing with backend...");
          
          const authResponse = await axios.post(`${backendUrl}/api/company/clerk-auth`, {
            email: email.trim(),
            clerkUserId: result.user?.id,
            newPassword: trimmedPassword
          });

          console.log("📊 Backend auth response:", authResponse.data);

          if (!authResponse.data.success) {
            // If backend sync fails, sign out from Clerk
            try {
              if (setActive) {
                await setActive({ session: null });
              }
            } catch (signOutError) {
              console.error("Sign out error:", signOutError);
            }
            
            toast.error(authResponse.data.message || "Account verification failed. This email may not be registered as a recruiter.");
            onClose();
            return;
          }

          // Set the active Clerk session
          if (setActive && result.createdSessionId) {
            await setActive({ session: result.createdSessionId });
          }
          
          // Set your backend authentication state
          setCompanyData(authResponse.data.company);
          setCompanyToken(authResponse.data.token);
          localStorage.setItem("companyToken", authResponse.data.token);
          
          toast.success("Password reset successfully! Your password has been synchronized across all systems.");
          
          // Close modal and navigate after a short delay
          setTimeout(() => {
            onClose();
            navigate('/dashboard');
          }, 1500);
          
        } catch (backendError) {
          console.error("❌ Backend authentication failed:", backendError);
          
          // If backend sync fails, at least inform the user
          if (backendError.response?.data?.message) {
            toast.error(backendError.response.data.message);
          } else {
            toast.warning("Password reset in Clerk successful, but database sync failed. Please try logging in normally.");
          }
          
          // Sign out from Clerk on backend failure
          try {
            if (setActive) {
              await setActive({ session: null });
            }
          } catch (signOutError) {
            console.error("Sign out error:", signOutError);
          }
          
          setTimeout(() => {
            onClose();
          }, 2000);
          return;
        }
        
      } else {
        console.log("❌ Clerk reset incomplete, status:", result.status);
        toast.error("Password reset incomplete. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error resetting password:", error);
      
      let errorMessage = "Failed to reset password. Please try again.";
      
      if (error.errors && error.errors.length > 0) {
        const clerkError = error.errors[0];
        console.log("🔍 Clerk error details:", clerkError);
        
        const errorMsg = clerkError.longMessage || clerkError.message;
        
        if (errorMsg?.toLowerCase().includes('data breach') || errorMsg?.toLowerCase().includes('found in an online')) {
          errorMessage = "This password has been found in a data breach. Please choose a more secure password.";
        } else if (errorMsg?.toLowerCase().includes('too weak') || errorMsg?.toLowerCase().includes('strength')) {
          errorMessage = "Password is too weak. Please use a stronger password with mixed case, numbers, and symbols.";
        } else if (errorMsg?.toLowerCase().includes('invalid') && errorMsg?.toLowerCase().includes('code')) {
          errorMessage = "Invalid verification code. Please check your email and try again.";
        } else if (errorMsg?.toLowerCase().includes('expired')) {
          errorMessage = "Verification code has expired. Please request a new reset email.";
          setStep(1);
        } else if (clerkError.code === "form_code_incorrect") {
          errorMessage = "Invalid verification code. Please check your email and try again.";
        } else if (clerkError.code === "session_exists") {
          errorMessage = "You are already signed in. Please sign out and try again.";
        } else {
          errorMessage = errorMsg || "Failed to reset password. Please try again.";
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { type: "spring", stiffness: 350, damping: 25 } 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95, 
      transition: { duration: 0.2 } 
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial="hidden"
      animate="visible"
      variants={overlayVariants}
    >
      <motion.div 
        className="relative w-full max-w-md"
        variants={modalVariants}
      >
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl">
          
          {/* Glass effect top area */}
          <div className="relative h-32 flex items-center justify-center" style={{ backgroundColor: '#020330' }}>
            <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-red-400 opacity-20 blur-xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-red-300 opacity-20 blur-xl"></div>
            
            <div className="absolute -bottom-12 flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg p-1">
              <div className="flex items-center justify-center w-full h-full rounded-full" style={{ backgroundColor: '#FF0000' }}>
                <Lock size={36} className="text-white" />
              </div>
            </div>
          </div>

          {/* Header text */}
          <div className="px-8 pt-16 pb-4">
            <h1 className="text-2xl font-bold text-center mb-1" style={{ color: '#020330' }}>
              {step === 1 ? "Reset Recruiter Password" : "Enter Reset Code"}
            </h1>
            <p className="text-sm text-center text-gray-500">
              {step === 1 
                ? "Enter your recruiter email to receive a reset code" 
                : "Check your email for the verification code"
              }
            </p>
          </div>

          <form onSubmit={step === 1 ? handleSendResetEmail : handleResetPassword} className="px-8 pb-6 space-y-4">
            {step === 1 ? (
              // Step 1: Email input
              <>
                <div className="space-y-1.5">
                  <label htmlFor="reset-email" className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                    <Mail size={14} className="text-gray-500" />
                    Recruiter Email Address
                  </label>
                  <input
                    id="reset-email"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400"
                    style={{ '--tw-ring-color': '#FF0000' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Enter your registered recruiter email"
                    required
                  />
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> This will only work for recruiter accounts. 
                    If you're a job seeker, please use the candidate login page.
                  </p>
                </div>
              </>
            ) : (
              // Step 2: Code and new password
              <>
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">
                    We sent a reset code to: <strong>{email}</strong>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reset-code" className="text-sm font-medium text-gray-700 ml-1">
                    Verification Code
                  </label>
                  <input
                    id="reset-code"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400"
                    style={{ '--tw-ring-color': '#FF0000' }}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    type="text"
                    placeholder="Enter verification code"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                    <Lock size={14} className="text-gray-500" />
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400"
                      style={{ '--tw-ring-color': '#FF0000' }}
                      value={newPassword}
                      onChange={handlePasswordChange}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      required
                      minLength={8}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Password strength indicator */}
                  {newPassword && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-1 h-2">
                        {[1, 2, 3, 4, 5, 6].map((level) => (
                          <div 
                            key={level}
                            className={`h-full rounded-full flex-1 transition-all ${
                              passwordStrength >= level 
                                ? passwordStrength <= 2 
                                  ? "bg-red-400" 
                                  : passwordStrength <= 4 
                                    ? "bg-yellow-400" 
                                    : "bg-green-400"
                                : "bg-gray-200"
                            }`}
                          ></div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-600">
                        <p className={`font-medium ${
                          passwordStrength <= 2 ? "text-red-600" :
                          passwordStrength <= 4 ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {passwordStrength <= 2 && "Weak password"}
                          {passwordStrength === 3 && "Fair password"}
                          {passwordStrength === 4 && "Good password"}
                          {passwordStrength === 5 && "Strong password"}
                          {passwordStrength === 6 && "Very strong password"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading || (step === 2 && passwordStrength < 4)}
              className="relative w-full py-3.5 mt-6 font-medium text-white transition-all rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md hover:shadow-lg disabled:opacity-70"
              style={{ 
                backgroundColor: '#FF0000',
                '--tw-ring-color': 'rgba(255, 0, 0, 0.5)'
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {step === 1 ? "Verifying..." : "Resetting..."}
                </span>
              ) : (
                step === 1 ? "Send Reset Code" : "Reset Password"
              )}
            </button>

            {/* Password strength warning */}
            {step === 2 && newPassword && passwordStrength < 4 && (
              <div className="mt-2">
                <p className="text-xs text-orange-600 text-center">
                  Please create a stronger password to continue
                </p>
              </div>
            )}
          </form>

          {/* Back button */}
          {step === 2 && (
            <div className="px-8 pb-4">
              <button
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to email
              </button>
            </div>
          )}

          {/* Return to login */}
          <div className="py-5 bg-gray-50 border-t border-gray-100 rounded-b-3xl">
            <div className="flex justify-center px-8">
              <p className="text-sm text-gray-600">
                Remember your password? 
                <button
                  type="button"
                  onClick={onBack}
                  className="ml-1 font-medium hover:opacity-80 transition-colors"
                  style={{ color: '#FF0000' }}
                >
                  Back to login
                </button>
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 transition-colors rounded-full hover:bg-white/20 hover:text-white focus:outline-none"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ClerkForgotPassword;