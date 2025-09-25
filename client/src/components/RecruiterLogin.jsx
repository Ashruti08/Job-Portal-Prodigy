import React, { useContext, useState, useRef } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, X, Upload, Github, Linkedin, Phone, ArrowLeft } from "lucide-react";
import { useSignIn, useUser } from '@clerk/clerk-react';

// Role-Based Clerk Forgot Password Component
// Replace the existing ClerkForgotPassword component in your RecruiterLogin.jsx with this updated version

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
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      // First, check if this email belongs to a recruiter in your backend
      const { data } = await axios.post(`${backendUrl}/api/company/check-recruiter-email`, {
        email
      });

      if (!data.isRecruiter) {
        toast.error("This email is not registered as a recruiter account.");
        setIsLoading(false);
        return;
      }

      // If it's a recruiter, proceed with Clerk reset
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      
      toast.success("Reset code sent to your recruiter email!");
      setStep(2);
    } catch (error) {
      console.error("Error sending reset email:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.errors?.[0]?.longMessage || "Failed to send reset email");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code and reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code || !newPassword) {
      toast.error("Please enter both verification code and new password");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      toast.error("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code,
        password: newPassword,
      });

      if (result.status === "complete") {
        // First verify this is a recruiter account and get company data
        try {
          const backendVerification = await axios.post(`${backendUrl}/api/company/verify-recruiter-reset`, {
            email: email,
            clerkUserId: result.user?.id
          });

          if (!backendVerification.data.success || !backendVerification.data.isRecruiter) {
            // Sign out immediately if not a recruiter
            try {
              await signIn.signOut();
            } catch (signOutError) {
              console.error("Sign out error:", signOutError);
            }
            
            toast.error("Access denied. This email is not registered as a recruiter account.");
            onClose();
            return;
          }

          // Set the active Clerk session
          await setActive({ session: result.createdSessionId });
          
          // Set additional metadata to ensure role persistence
          try {
            await result.user?.update({
              publicMetadata: { 
                ...result.user.publicMetadata,
                role: 'recruiter',
                accountType: 'company',
                lastLoginType: 'recruiter'
              }
            });
          } catch (metadataError) {
            console.warn("Could not update user metadata:", metadataError);
          }

          // **CRITICAL FIX**: Now authenticate with your backend and update password
          try {
            // Use the email, clerk ID, and new password to authenticate with your backend
            const authResponse = await axios.post(`${backendUrl}/api/company/clerk-auth`, {
              email: email,
              clerkUserId: result.user?.id,
              newPassword: newPassword  // **This is the key addition**
            });

            if (authResponse.data.success) {
              // Set your backend authentication state
              setCompanyData(authResponse.data.company);
              setCompanyToken(authResponse.data.token);
              localStorage.setItem("companyToken", authResponse.data.token);
              
              toast.success("Password reset successfully! Your backend password has been synchronized.");
              
              // Close modal and navigate
              setTimeout(() => {
                onClose();
                navigate('/dashboard');
              }, 1500);
              
            } else {
              throw new Error(authResponse.data.message || "Backend authentication failed");
            }
          } catch (backendAuthError) {
            console.error("Backend authentication failed:", backendAuthError);
            
            // Fallback: Use the company data from verification response
            if (backendVerification.data.companyData) {
              setCompanyData(backendVerification.data.companyData);
              toast.success("Password reset successfully! Please login with your new password next time.");
              
              setTimeout(() => {
                onClose();
                navigate('/dashboard');
              }, 1500);
            } else {
              toast.error("Authentication error. Please try logging in normally with your new password.");
              onClose();
            }
          }
          
        } catch (verificationError) {
          console.error("Recruiter verification failed:", verificationError);
          
          // Sign out on verification failure
          try {
            await signIn.signOut();
          } catch (signOutError) {
            console.error("Sign out error:", signOutError);
          }
          
          toast.error("Account verification failed. This email may not be registered as a recruiter.");
          onClose();
          return;
        }
      } else {
        toast.error("Password reset incomplete. Please try again.");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      
      const errorMessage = error.errors?.[0]?.longMessage || error.errors?.[0]?.message;
      
      if (errorMessage?.toLowerCase().includes('data breach') || errorMessage?.toLowerCase().includes('found in an online')) {
        toast.error("This password has been found in a data breach. Please choose a more secure password.", {
          autoClose: 5000,
        });
      } else if (errorMessage?.toLowerCase().includes('too weak') || errorMessage?.toLowerCase().includes('strength')) {
        toast.error("Password is too weak. Please use a stronger password with mixed case, numbers, and symbols.");
      } else if (errorMessage?.toLowerCase().includes('invalid') && errorMessage?.toLowerCase().includes('code')) {
        toast.error("Invalid verification code. Please check your email and try again.");
      } else if (errorMessage?.toLowerCase().includes('expired')) {
        toast.error("Verification code has expired. Please request a new reset email.");
        setStep(1);
      } else {
        toast.error(errorMessage || "Failed to reset password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of the component remains the same (overlayVariants, modalVariants, JSX)
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

                  {/* Password requirements */}
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-medium text-blue-800 mb-2">Password Requirements:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600' : 'text-blue-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-blue-400'}`}></span>
                        At least 8 characters long
                      </li>
                      <li className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-blue-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-blue-400'}`}></span>
                        One uppercase letter
                      </li>
                      <li className={`flex items-center gap-2 ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-blue-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-blue-400'}`}></span>
                        One lowercase letter
                      </li>
                      <li className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-blue-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-blue-400'}`}></span>
                        One number
                      </li>
                      <li className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-600' : 'text-blue-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${/[^A-Za-z0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-blue-400'}`}></span>
                        One special character (!@#$%^&*)
                      </li>
                    </ul>
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      💡 Avoid common passwords for better security
                    </p>
                  </div>
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
const RecruiterLogin = () => {
  const navigate = useNavigate();
  const [state, setState] = useState("Sign Up");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState(null);
  const [isTextDataSubmited, setIsTextDataSubmited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const dragAreaRef = useRef(null);

  const { setShowRecruiterLogin, backendUrl, setCompanyToken, setCompanyData } =
    useContext(AppContext);

  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length > 6) score += 1;
    if (pass.length > 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 15);
    setPhone(value);
  };

  const formatPhoneForDisplay = (phoneNumber) => {
    if (phoneNumber.length <= 3) return phoneNumber;
    if (phoneNumber.length <= 6) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    if (phoneNumber.length <= 10) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.add("border-red-500", "bg-red-50");
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove("border-red-500", "bg-red-50");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove("border-red-500", "bg-red-50");
    }
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImage(file);
    } else {
      toast.error("Please upload an image file");
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    if (state === "Sign Up" && !isTextDataSubmited) {
      if (passwordStrength < 3) {
        toast.warning("Please use a stronger password for better security");
        return;
      }
      if (phone.length < 10) {
        toast.error("Please enter a valid phone number");
        return;
      }
      return setIsTextDataSubmited(true);
    }

    setIsLoading(true);

    try {
      if (state === "Login") {
        const { data } = await axios.post(backendUrl + "/api/company/login", {
          email,
          password,
        });
        

        if (data.success) {
          if (!data.company.clerkUserId) {
    try {
      // Create Clerk user silently
      const { signUp } = await import('@clerk/clerk-react');
      const clerkSignUp = await signUp.create({
        emailAddress: email,
        password: password,
      });
      
      // Link Clerk ID to company
      await axios.post(`${backendUrl}/api/company/link-clerk-account`, {
        email: email,
        clerkUserId: clerkSignUp.createdUserId
      });
      
      console.log("Clerk account created and linked");
    } catch (clerkCreationError) {
      console.log("Clerk account creation failed:", clerkCreationError);
      // Continue with normal login even if Clerk creation fails
    }
  }
  
          setCompanyData(data.company);
          setCompanyToken(data.token);
          localStorage.setItem("companyToken", data.token);
          toast.success("Login successful! Redirecting to dashboard...");

          setTimeout(() => {
            setShowRecruiterLogin(false);
            navigate("/dashboard");
          }, 1000);
        } else {
          toast.error(data.message || "Login failed. Please check your credentials.");
        }
      } else {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("password", password);
        formData.append("email", email);
        formData.append("phone", phone);
        if (image) {
          formData.append("image", image);
        }

        const { data } = await axios.post(
          backendUrl + "/api/company/register",
          formData
        );
        
        if (data.success) {
          setCompanyData(data.company);
          setCompanyToken(data.token);
          localStorage.setItem("companyToken", data.token);
          toast.success("Account created successfully! Welcome aboard!");
          setTimeout(() => {
            setShowRecruiterLogin(false);
            navigate("/dashboard");
          }, 1000);
        } else {
          toast.error(data.message || "Registration failed. Please try again.");
        }
      }
    } catch (error) {
      console.error('RecruiterLogin error:', error);
      const errorMessage = error.response?.data?.message || error.message || "An error occurred. Please try again later.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setImage(null);
    setIsTextDataSubmited(false);
    setPasswordStrength(0);
  };

  const switchMode = (newState) => {
    setState(newState);
    resetForm();
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

  const formVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.3 } 
    },
    exit: { 
      opacity: 0, 
      x: 20, 
      transition: { duration: 0.2 } 
    }
  };

  // Show Clerk Forgot Password component if needed
  if (showForgotPassword) {
    return (
      <ClerkForgotPassword
        onClose={() => setShowRecruiterLogin(false)}
        onBack={() => setShowForgotPassword(false)}
      />
    );
  }

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
                <User size={36} className="text-white" />
              </div>
            </div>
          </div>

          {/* Header text */}
          <div className="px-8 pt-16 pb-4">
            <h1 className="text-2xl font-bold text-center mb-1" style={{ color: '#020330' }}>
              {state === "Login" ? "Welcome Back" : 
               isTextDataSubmited ? "Add Your Brand" : "Join Our Platform"}
            </h1>
            <p className="text-sm text-center text-gray-500">
              {state === "Login" 
                ? "Access your recruiter dashboard" 
                : isTextDataSubmited 
                  ? "Upload your company logo to complete setup" 
                  : "Create an account to find top talent"
              }
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={`${state}-${isTextDataSubmited}`}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={formVariants}
              onSubmit={onSubmitHandler}
              className="px-8 pb-6 space-y-4"
            >
              {state === "Sign Up" && isTextDataSubmited ? (
                <div className="flex flex-col items-center my-6">
                  <div 
                    ref={dragAreaRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="relative w-40 h-40 mb-4 overflow-hidden rounded-full border-2 border-dashed border-gray-300 transition-all duration-300 group cursor-pointer hover:border-red-400 bg-gray-50 flex items-center justify-center"
                  >
                    {image ? (
                      <div className="relative w-full h-full">
                        <img
                          src={URL.createObjectURL(image)}
                          alt="Company Logo Preview"
                          className="object-cover w-full h-full"
                        />
                        <div 
                          className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => setImage(null)}
                        >
                          <X size={20} className="text-white" />
                          <span className="text-xs font-medium text-white mt-1">Remove</span>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                        <div className="p-4 rounded-full bg-red-50 mb-3" style={{ color: '#FF0000' }}>
                          <Upload size={28} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: '#FF0000' }}>Upload logo</span>
                        <span className="text-xs text-gray-500 mt-1">Click or drag & drop</span>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && setImage(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {state !== "Login" && (
                    <>
                      <div className="space-y-1.5">
                        <label htmlFor="company-name" className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                          <User size={14} className="text-gray-500" />
                          Company Name
                        </label>
                        <input
                          id="company-name"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400"
                          style={{ '--tw-ring-color': '#FF0000' }}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          type="text"
                          placeholder="Enter your company name"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="phone" className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                          <Phone size={14} className="text-gray-500" />
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400"
                          style={{ '--tw-ring-color': '#FF0000' }}
                          value={formatPhoneForDisplay(phone)}
                          onChange={handlePhoneChange}
                          type="tel"
                          placeholder="Enter your phone number"
                          required
                        />
                        {phone.length > 0 && phone.length < 10 && (
                          <p className="text-xs text-red-500 ml-1">Phone number should be at least 10 digits</p>
                        )}
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                      <Mail size={14} className="text-gray-500" />
                      Email Address
                    </label>
                    <input
                      id="email"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400"
                      style={{ '--tw-ring-color': '#FF0000' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                      <Lock size={14} className="text-gray-500" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-gray-400"
                        style={{ '--tw-ring-color': '#FF0000' }}
                        value={password}
                        onChange={handlePasswordChange}
                        type={showPassword ? "text" : "password"}
                        placeholder={state === "Login" ? "Enter your password" : "Create a strong password"}
                        required
                      />
                      <button 
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    
                    {/* Password strength indicator (only for signup) */}
                    {state === "Sign Up" && password && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1 h-1.5">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div 
                              key={level}
                              className={`h-full rounded-full flex-1 transition-all ${
                                passwordStrength >= level 
                                  ? passwordStrength <= 2 
                                    ? "bg-red-400" 
                                    : passwordStrength <= 3 
                                      ? "bg-yellow-400" 
                                      : "bg-green-400"
                                  : "bg-gray-200"
                              }`}
                            ></div>
                          ))}
                        </div>
                        <p className="text-xs mt-1 text-gray-500">
                          {passwordStrength === 0 && "Enter a password"}
                          {passwordStrength === 1 && "Password is too weak"}
                          {passwordStrength === 2 && "Password is weak"}
                          {passwordStrength === 3 && "Password is good"}
                          {passwordStrength === 4 && "Password is strong"}
                          {passwordStrength === 5 && "Password is very strong"}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {state === "Login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm font-medium hover:opacity-80 transition-colors"
                    style={{ color: '#FF0000' }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full py-3.5 mt-4 font-medium text-white transition-all rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md hover:shadow-lg disabled:opacity-70"
                style={{ 
                  backgroundColor: '#FF0000',
                  '--tw-ring-color': 'rgba(255, 0, 0, 0.5)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#cc0000';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#FF0000';
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : state === "Login" ? (
                  "Sign In"
                ) : isTextDataSubmited ? (
                  "Create Account"
                ) : (
                  "Continue"
                )}
              </button>

              {/* Social login options */}
              {state === "Login" && (
                <div className="mt-5">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 text-gray-500 bg-white">Or continue with</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <button
                      type="button"
                      className="flex justify-center items-center py-2.5 border border-gray-200 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path fill="currentColor" d="M12 11v2h5.5c-.2 1.1-1.5 3.5-5.5 3.5-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.4-2.4C16.4 2 14.4 1 12 1 6.5 1 2 5.5 2 11s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="flex justify-center items-center py-2.5 border border-gray-200 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      <Linkedin size={20} />
                    </button>
                    <button
                      type="button"
                      className="flex justify-center items-center py-2.5 border border-gray-200 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      <Github size={20} />
                    </button>
                  </div>
                </div>
              )}
            </motion.form>
          </AnimatePresence>

          {/* Account toggle */}
          <div className="py-5 bg-gray-50 border-t border-gray-100 rounded-b-3xl">
            <div className="flex justify-center px-8">
              <p className="text-sm text-gray-600">
                {state === "Login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => switchMode(state === "Login" ? "Sign Up" : "Login")}
                  className="font-medium hover:opacity-80 transition-colors"
                  style={{ color: '#FF0000' }}
                >
                  {state === "Login" ? "Sign up now" : "Sign in"}
                </button>
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => setShowRecruiterLogin(false)}
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

export default RecruiterLogin;