import React, { useContext, useState, useRef, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, X, Upload, Phone } from "lucide-react";

const ForgotPassword = ({ onBack, onClose }) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { backendUrl, setCompanyToken, setCompanyData } = useContext(AppContext);

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

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/company/send-reset-code`, { email });

      if (data.success) {
        toast.success("Reset code sent to your email!");
        setStep(2);
      } else {
        toast.error(data.message || "Failed to send reset code");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

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

    setIsLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/company/verify-reset-code`, {
        email,
        code,
        newPassword
      });

      if (data.success) {
        setCompanyData(data.company);
        setCompanyToken(data.token);
        localStorage.setItem("companyToken", data.token);
        
        toast.success("Password reset successfully!");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <motion.div className="relative w-full max-w-md mx-auto max-h-[95vh] overflow-y-auto">
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl">
          <div className="relative h-24 sm:h-32 flex items-center justify-center" style={{ backgroundColor: '#020330' }}>
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
          </div>

          <form onSubmit={step === 1 ? handleSendResetEmail : handleResetPassword} className="px-6 sm:px-8 pb-6 space-y-4">
            {step === 1 ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Mail size={14} className="text-gray-500" />
                  Recruiter Email Address
                </label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Enter your registered recruiter email"
                  required
                />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">Verification Code</label>
                  <input
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    type="text"
                    placeholder="Enter verification code"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 ml-1">New Password</label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl"
                      value={newPassword}
                      onChange={handlePasswordChange}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      required
                      minLength={8}
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-4"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-6 font-medium text-white rounded-xl"
              style={{ backgroundColor: '#FF0000' }}
            >
              {isLoading ? "Processing..." : (step === 1 ? "Send Reset Code" : "Reset Password")}
            </button>
          </form>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 p-2 text-white/90 rounded-full hover:bg-white/20"
          >
            <X size={20} />
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
  const [showGooglePhoneInput, setShowGooglePhoneInput] = useState(false);
  const [showGoogleLogoUpload, setShowGoogleLogoUpload] = useState(false);
  const [googleCredential, setGoogleCredential] = useState(null);
  const [googleUserInfo, setGoogleUserInfo] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { setShowRecruiterLogin, backendUrl, setCompanyToken, setCompanyData } = useContext(AppContext);

  // Handle Google OAuth Login
  const handleGoogleLogin = async (credentialResponse) => {
    console.log('=== Google Login Callback Triggered ===');
    console.log('Credential Response:', credentialResponse);
    
    try {
      // ✅ Check if credential exists
      if (!credentialResponse || !credentialResponse.credential) {
        console.error('❌ No credential in response');
        toast.error("Google Sign-In failed. Please try again.");
        return;
      }

      // Decode JWT to get user info
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const userInfo = JSON.parse(jsonPayload);
      console.log('✅ Google User Info:', userInfo);
      
      // Store credential and user info
      setGoogleCredential(credentialResponse.credential);
      setGoogleUserInfo(userInfo);
      
      // ✅ Step 1: Try to login first (check if user exists)
      setIsLoading(true);
      
      try {
        console.log('📤 Attempting login with Google credential');

        const { data } = await axios.post(`${backendUrl}/api/company/google-auth`, 
          { credential: credentialResponse.credential },
          { headers: { 'Content-Type': 'application/json' } }
        );

        console.log('📥 Backend response:', data);

        if (data.success) {
          // ✅ User exists - Login successful
          setCompanyData(data.company);
          setCompanyToken(data.token);
          localStorage.setItem("companyToken", data.token);
          toast.success(data.isNewUser ? "Account created successfully!" : "Login successful!");
          setTimeout(() => {
            setShowRecruiterLogin(false);
            navigate("/dashboard");
          }, 1000);
        } else if (data.requiresPhone) {
          // ✅ New user - Need phone number for signup
          console.log('📝 New user detected - requesting phone number');
          setIsLoading(false);
          setName(userInfo.name || '');
          setEmail(userInfo.email || '');
          setImage(null);
          setShowGooglePhoneInput(true);
          toast.info("Please enter your phone number to complete registration");
        } else {
          // Other errors
          setIsLoading(false);
          toast.error(data.message || "Google authentication failed");
        }
      } catch (error) {
        setIsLoading(false);
        console.error('❌ Backend error:', error);
        console.error('Error response:', error.response?.data);
        toast.error(error.response?.data?.message || "Google authentication failed");
      }
      
    } catch (error) {
      console.error('❌ Google login processing error:', error);
      toast.error("Failed to process Google authentication");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID is not defined in .env');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLogin,
          auto_select: false,
          cancel_on_tap_outside: false,
        });
      }
    };
    
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(value);
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    
    if (file.size > 204800) {
      toast.error('Image size must be less than 200KB');
      return;
    }
    
    setImage(file);
  };

  const handleGoogleButtonClick = () => {
    if (!window.google) {
      toast.error("Google Sign-In is not loaded. Please refresh the page.");
      return;
    }

    try {
      // ✅ Direct prompt method - more reliable
      window.google.accounts.id.prompt((notification) => {
        console.log('Google prompt notification:', notification);
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google prompt not shown, trying alternate method');
          // Fallback to button click method
          triggerGoogleButton();
        }
      });
    } catch (error) {
      console.error('Error with Google prompt:', error);
      // Fallback to button method
      triggerGoogleButton();
    }
  };

  const triggerGoogleButton = () => {
    const buttonContainer = document.getElementById('googleSignInButton');
    if (!buttonContainer) {
      console.error('Google button container not found');
      return;
    }

    try {
      buttonContainer.innerHTML = '';
      
      window.google.accounts.id.renderButton(
        buttonContainer,
        {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        }
      );
      
      setTimeout(() => {
        const googleBtn = buttonContainer.querySelector('div[role="button"]');
        if (googleBtn) {
          googleBtn.click();
        } else {
          console.error('Google button not found after rendering');
          toast.error("Please try clicking again");
        }
      }, 100);
    } catch (error) {
      console.error('Error rendering Google button:', error);
      toast.error("Google Sign-In failed. Please try again.");
    }
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    
    if (phone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setShowGooglePhoneInput(false);
    setShowGoogleLogoUpload(true);
  };

  const handleGoogleSignupSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validate credential exists
    if (!googleCredential) {
      toast.error("Session expired. Please try signing in with Google again.");
      setShowGoogleLogoUpload(false);
      setShowGooglePhoneInput(false);
      return;
    }

    // ✅ Validate phone number
    if (phone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    try {
      console.log('📤 Submitting Google signup with:', {
        hasCredential: !!googleCredential,
        credentialLength: googleCredential?.length,
        phone: phone,
        name: name,
        hasImage: !!image
      });

      const formData = new FormData();
      formData.append("credential", googleCredential);
      formData.append("phone", phone);
      formData.append("name", name);
      formData.append("isSignup", "true");
      
      if (image) {
        formData.append("image", image);
      }

      console.log('📤 FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value);
      }

      const { data } = await axios.post(`${backendUrl}/api/company/google-auth`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('📥 Signup response:', data);

      if (data.success) {
        setCompanyData(data.company);
        setCompanyToken(data.token);
        localStorage.setItem("companyToken", data.token);
        toast.success("Account created successfully!");
        setTimeout(() => {
          setShowRecruiterLogin(false);
          navigate("/dashboard");
        }, 1000);
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error('❌ Google signup error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    if (state === "Sign Up" && !isTextDataSubmited) {
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
          setCompanyData(data.company);
          setCompanyToken(data.token);
          localStorage.setItem("companyToken", data.token);
          toast.success("Login successful!");
          setTimeout(() => {
            setShowRecruiterLogin(false);
            navigate("/dashboard");
          }, 1000);
        } else {
          // ✅ Check if user should use Google Sign-In
          if (data.useGoogleAuth) {
            toast.error(
              "This account uses Google Sign-In. Please click 'Continue with Google' button below.",
              { autoClose: 5000 }
            );
          } else {
            toast.error(data.message || "Login failed");
          }
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
          toast.success("Account created successfully!");
          setTimeout(() => {
            setShowRecruiterLogin(false);
            setState("Login");
          }, 1500);
        } else {
          toast.error(data.message || "Registration failed");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <ForgotPassword
        onClose={() => setShowRecruiterLogin(false)}
        onBack={() => setShowForgotPassword(false)}
      />
    );
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <motion.div className="relative w-full max-w-md mx-auto max-h-[95vh] overflow-y-auto">
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl">
          <div className="relative h-24 sm:h-32 flex items-center justify-center" style={{ backgroundColor: '#020330' }}>
            <div className="absolute -bottom-8 sm:-bottom-12 flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white shadow-lg p-1">
              <div className="flex items-center justify-center w-full h-full rounded-full" style={{ backgroundColor: '#FF0000' }}>
                <User size={24} className="sm:size-9 text-white" />
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 pt-12 sm:pt-16 pb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-center mb-1" style={{ color: '#020330' }}>
              {showGooglePhoneInput ? "Enter Your Phone Number" :
               showGoogleLogoUpload ? "Add Your Company Logo" :
               state === "Login" ? "Welcome Back" : 
               isTextDataSubmited ? "Add Your Brand" : "Join as a Recruiter"}
            </h1>
            <p className="text-sm text-center text-gray-500">
              {showGoogleLogoUpload ? "(Optional - Max 200KB)" : ""}
            </p>
          </div>

          {showGooglePhoneInput ? (
            <form onSubmit={handlePhoneSubmit} className="px-6 sm:px-8 pb-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 ml-1">Company Name</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="Enter your company name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
                <input
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl"
                  value={email}
                  type="email"
                  disabled
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Phone size={14} className="text-gray-500" />
                  Phone Number *
                </label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                  value={phone}
                  onChange={handlePhoneChange}
                  type="tel"
                  placeholder="Enter your 10-digit phone number"
                  required
                />
                <p className="text-xs text-gray-500 ml-1">
                  ⚠️ Each phone number can only be registered once
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 mt-4 font-medium text-white rounded-xl"
                style={{ backgroundColor: '#FF0000' }}
              >
                Continue to Logo Upload
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowGooglePhoneInput(false);
                  setGoogleCredential(null);
                  setGoogleUserInfo(null);
                  setPhone("");
                  setName("");
                  setEmail("");
                }}
                className="w-full py-2 text-sm text-gray-600"
              >
                ← Back to sign up options
              </button>
            </form>
          ) : showGoogleLogoUpload ? (
            <form onSubmit={handleGoogleSignupSubmit} className="px-6 sm:px-8 pb-6 space-y-4">
              <div className="flex flex-col items-center my-6">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4 overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer">
                  {image ? (
                    <div className="relative w-full h-full group">
                      <img src={URL.createObjectURL(image)} alt="Logo" className="object-cover w-full h-full" />
                      <div 
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 cursor-pointer"
                        onClick={() => setImage(null)}
                      >
                        <X size={20} className="text-white" />
                        <span className="text-xs text-white mt-1">Remove</span>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="logo-upload-google" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                      <Upload size={24} style={{ color: '#FF0000' }} />
                      <span className="text-sm font-medium mt-2" style={{ color: '#FF0000' }}>Upload logo</span>
                      <span className="text-xs text-gray-500 mt-1">Optional - Max 200KB</span>
                      <input
                        id="logo-upload-google"
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files[0] && handleImageSelect(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-4 font-medium text-white rounded-xl disabled:opacity-50"
                style={{ backgroundColor: '#FF0000' }}
              >
                {isLoading ? "Creating Account..." : "Complete Registration"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowGoogleLogoUpload(false);
                  setShowGooglePhoneInput(true);
                }}
                className="w-full py-2 text-sm text-gray-600"
              >
                ← Back to phone number
              </button>
            </form>
          ) : state === "Sign Up" && isTextDataSubmited ? (
            <form onSubmit={onSubmitHandler} className="px-6 sm:px-8 pb-6 space-y-4">
              <div className="flex flex-col items-center my-6">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4 overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer">
                  {image ? (
                    <div className="relative w-full h-full group">
                      <img src={URL.createObjectURL(image)} alt="Logo" className="object-cover w-full h-full" />
                      <div 
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 cursor-pointer"
                        onClick={() => setImage(null)}
                      >
                        <X size={20} className="text-white" />
                        <span className="text-xs text-white mt-1">Remove</span>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                      <Upload size={24} style={{ color: '#FF0000' }} />
                      <span className="text-sm font-medium mt-2" style={{ color: '#FF0000' }}>Upload logo</span>
                      <span className="text-xs text-gray-500 mt-1">Max 200KB</span>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files[0] && handleImageSelect(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-4 font-medium text-white rounded-xl disabled:opacity-50"
                style={{ backgroundColor: '#FF0000' }}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          ) : (
            <form onSubmit={onSubmitHandler} className="px-6 sm:px-8 pb-6 space-y-4">
              {state !== "Login" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 ml-1">Company Name</label>
                    <input
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                      placeholder="Enter your company name"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 ml-1">Phone Number</label>
                    <input
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                      value={phone}
                      onChange={handlePhoneChange}
                      type="tel"
                      placeholder="Enter your 10-digit phone number"
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    required
                  />
                  <button 
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {state === "Login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm font-medium"
                    style={{ color: '#FF0000' }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-4 font-medium text-white rounded-xl disabled:opacity-50"
                style={{ backgroundColor: '#FF0000' }}
              >
                {isLoading ? "Processing..." : state === "Login" ? "Sign In" : "Continue"}
              </button>
            </form>
          )}

          {!isTextDataSubmited && !showGooglePhoneInput && !showGoogleLogoUpload && (
            <div className="px-6 sm:px-8 pb-6 space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-gray-200 w-full"></div>
                <span className="px-3 text-sm text-gray-500 bg-white absolute">or</span>
              </div>
              
              <button
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={isLoading}
                className="w-full py-3.5 px-4 flex items-center justify-center gap-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg active:scale-95 disabled:opacity-50"
                style={{ 
                  backgroundColor: '#FF0000',
                  color: 'white',
                  border: 'none'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white"/>
                </svg>
                <span>Continue with Google</span>
              </button>
              
              <div 
                id="googleSignInButton" 
                style={{ 
                  position: 'absolute',
                  left: '-9999px',
                  width: '1px',
                  height: '1px',
                  overflow: 'hidden'
                }}
              ></div>
            </div>
          )}

          <div className="py-4 bg-gray-50 border-t border-gray-100 rounded-b-3xl">
            <div className="flex justify-center px-6">
              <p className="text-sm text-gray-600">
                {state === "Login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setState(state === "Login" ? "Sign Up" : "Login");
                    setShowGooglePhoneInput(false);
                    setShowGoogleLogoUpload(false);
                  }}
                  className="font-medium"
                  style={{ color: '#FF0000' }}
                >
                  {state === "Login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowRecruiterLogin(false)}
            className="absolute top-2 right-2 p-2 text-white/90 rounded-full hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RecruiterLogin;