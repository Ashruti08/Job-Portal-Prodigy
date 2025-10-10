import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, X, ArrowLeft } from "lucide-react";
import { useSignIn } from '@clerk/clerk-react';

const ForgotPassword = ({ onBack, onClose }) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { signIn, setActive, isLoaded } = useSignIn();
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

    console.log("=== SENDING RESET EMAIL ===");
    console.log("Email:", trimmedEmail);

    if (!isLoaded || !signIn) {
      toast.error("Authentication system is loading. Please wait and try again.");
      return;
    }

    setIsLoading(true);
    try {
      // First verify email is a recruiter in MongoDB
      console.log("Checking if email is recruiter...");
      const { data } = await axios.post(`${backendUrl}/api/company/check-recruiter-email`, {
        email: trimmedEmail
      });

      console.log("Check recruiter response:", data);

      if (!data.success || !data.isRecruiter) {
        toast.error(data.message || "This email is not registered as a recruiter account.");
        setIsLoading(false);
        return;
      }

      console.log("✅ Email verified as recruiter, sending Clerk reset code...");

      // Send reset code via Clerk
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: trimmedEmail,
      });
      
      console.log("✅ Reset code sent successfully");
      toast.success("Reset code sent to your email! Check your inbox.");
      setStep(2);
      
    } catch (error) {
      console.error("Error sending reset email:", error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.errors && error.errors.length > 0) {
        const clerkError = error.errors[0];
        console.log("Clerk error:", clerkError);
        
        if (clerkError.code === "form_identifier_not_found") {
          toast.error("No Clerk account found for this email. This might be an old account. Please contact support.");
        } else {
          toast.error(clerkError.longMessage || clerkError.message || "Failed to send reset email");
        }
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code and reset password in BOTH systems
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
      toast.error("Password must contain uppercase, lowercase, and number");
      return;
    }

    console.log("=== RESETTING PASSWORD ===");
    console.log("Code provided:", trimmedCode.length > 0);
    console.log("Password strength:", passwordStrength);

    setIsLoading(true);
    try {
      if (!signIn) {
        toast.error("Authentication service is not available. Please refresh and try again.");
        setIsLoading(false);
        return;
      }

      console.log("Step 1: Resetting password in Clerk...");
      
      // Step 1: Reset password in Clerk
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: trimmedCode,
        password: trimmedPassword,
      });

      console.log("Clerk reset result status:", result.status);

      if (result.status === "complete") {
        console.log("✅ Clerk password reset successful");
        
        // Step 2: CRITICAL - Sync password with MongoDB backend
        try {
          console.log("Step 2: Syncing password with MongoDB...");
          
          const syncResponse = await axios.post(`${backendUrl}/api/company/clerk-auth`, {
            email: email.trim(),
            clerkUserId: result.createdUserId,
            newPassword: trimmedPassword
          });

          console.log("MongoDB sync response:", syncResponse.data);

          if (!syncResponse.data.success) {
            // If backend sync fails, warn user but continue
            console.error("⚠️ MongoDB sync failed");
            toast.warning("Password reset in Clerk succeeded, but database sync failed. Please contact support.");
            
            // Still try to set session
            if (setActive && result.createdSessionId) {
              await setActive({ session: result.createdSessionId });
            }
            
            setTimeout(() => {
              onClose();
            }, 2000);
            return;
          }

          // Step 3: Set Clerk session
          if (setActive && result.createdSessionId) {
            await setActive({ session: result.createdSessionId });
            console.log("✅ Clerk session activated");
          }
          
          // Step 4: Set MongoDB authentication
          setCompanyData(syncResponse.data.company);
          setCompanyToken(syncResponse.data.token);
          localStorage.setItem("companyToken", syncResponse.data.token);
          
          console.log("✅ Password reset complete in both systems");
          toast.success("Password reset successfully! Redirecting...");
          
          setTimeout(() => {
            onClose();
            navigate('/dashboard');
          }, 1500);
          
        } catch (backendError) {
          console.error("❌ Backend synchronization failed:", backendError);
          
          // Sign out from Clerk on backend failure
          try {
            if (setActive) {
              await setActive({ session: null });
            }
          } catch (signOutError) {
            console.error("Sign out error:", signOutError);
          }
          
          const errorMessage = backendError.response?.data?.message || 
            "Password reset succeeded in authentication, but database sync failed. Please contact support.";
          toast.error(errorMessage);
          
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
      console.error("Error resetting password:", error);
      
      let errorMessage = "Failed to reset password. Please try again.";
      
      if (error.errors && error.errors.length > 0) {
        const clerkError = error.errors[0];
        console.log("Clerk error details:", clerkError);
        
        const errorMsg = clerkError.longMessage || clerkError.message;
        
        if (errorMsg?.toLowerCase().includes('data breach') || errorMsg?.toLowerCase().includes('found in an online')) {
          errorMessage = "This password has been found in a data breach. Please choose a more secure password.";
        } else if (errorMsg?.toLowerCase().includes('too weak') || errorMsg?.toLowerCase().includes('strength')) {
          errorMessage = "Password is too weak. Use uppercase, lowercase, numbers, and symbols.";
        } else if (errorMsg?.toLowerCase().includes('invalid') && errorMsg?.toLowerCase().includes('code')) {
          errorMessage = "Invalid verification code. Please check your email and try again.";
        } else if (errorMsg?.toLowerCase().includes('expired')) {
          errorMessage = "Verification code has expired. Please request a new reset email.";
          setStep(1);
        } else if (clerkError.code === "form_code_incorrect") {
          errorMessage = "Invalid verification code. Please check your email and try again.";
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

  // Loading state while Clerk initializes
  if (!isLoaded) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial="hidden"
        animate="visible"
        variants={overlayVariants}
      >
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
            <p className="text-gray-600">Loading authentication system...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
      initial="hidden"
      animate="visible"
      variants={overlayVariants}
    >
      <motion.div 
        className="relative w-full max-w-md mx-auto"
        variants={modalVariants}
      >
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl">
          
          <div className="relative h-24 sm:h-32 flex items-center justify-center" style={{ backgroundColor: '#020330' }}>
            <div className="absolute -top-8 -left-8 w-24 sm:w-32 h-24 sm:h-32 rounded-full bg-red-400 opacity-20 blur-xl"></div>
            <div className="absolute bottom-0 right-0 w-32 sm:w-40 h-32 sm:h-40 rounded-full bg-red-300 opacity-20 blur-xl"></div>
            
            <div className="absolute -bottom-8 sm:-bottom-12 flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white shadow-lg p-1">
              <div className="flex items-center justify-center w-full h-full rounded-full" style={{ backgroundColor: '#FF0000' }}>
                <Lock size={24} className="sm:size-9 text-white" />
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 pt-12 sm:pt-16 pb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-center mb-1" style={{ color: '#020330' }}>
              {step === 1 ? "Reset Recruiter Password" : "Enter Reset Code"}
            </h1>
            <p className="text-sm text-center text-gray-500">
              {step === 1 
                ? "Enter your recruiter email to receive a reset code" 
                : "Check your email for the verification code"
              }
            </p>
          </div>

          <form onSubmit={step === 1 ? handleSendResetEmail : handleResetPassword} className="px-6 sm:px-8 pb-6 space-y-4">
            {step === 1 ? (
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
                    <strong>Note:</strong> This will only work for recruiter accounts with Clerk authentication. 
                    If you registered before Clerk integration, please contact support.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">
                    We sent a reset code to: <strong className="break-all">{email}</strong>
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
                      className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400"
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

            {step === 2 && newPassword && passwordStrength < 4 && (
              <div className="mt-2">
                <p className="text-xs text-orange-600 text-center">
                  Please create a stronger password to continue
                </p>
              </div>
            )}
          </form>

          {step === 2 && (
            <div className="px-6 sm:px-8 pb-4">
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

          <div className="py-4 sm:py-5 bg-gray-50 border-t border-gray-100 rounded-b-3xl">
            <div className="flex justify-center px-6 sm:px-8">
              <p className="text-sm text-gray-600 text-center">
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

          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 sm:p-3 text-white/90 transition-all duration-200 rounded-full hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 z-10"
            aria-label="Close"
          >
            <X size={20} className="sm:size-6" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ForgotPassword;