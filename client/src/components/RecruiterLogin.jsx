import React, { useContext, useState, useRef } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, X, Upload, Github, Linkedin, Phone, ArrowLeft } from "lucide-react";

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
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const dragAreaRef = useRef(null);

  const { setShowRecruiterLogin, backendUrl, setCompanyToken, setCompanyData } = useContext(AppContext);

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

  const handleImageSelect = (file) => {
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    
    // Check file size (200KB = 204800 bytes)
    if (file.size > 204800) {
      toast.error('Image size must be less than 200KB');
      return;
    }
    
    setImage(file);
  };

  // Main form submission handler
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    if (state === "Sign Up" && !isTextDataSubmited) {
      if (passwordStrength < 3) {
        toast.warning("Please use a stronger password");
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
          setCompanyData(data.company);
          setCompanyToken(data.token);
          localStorage.setItem("companyToken", data.token);
          toast.success("Login successful!");
          setTimeout(() => {
            setShowRecruiterLogin(false);
            navigate("/dashboard");
          }, 1000);
        } else {
          toast.error(data.message || "Login failed");
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
              {state === "Login" ? "Welcome Back" : 
               isTextDataSubmited ? "Add Your Brand" : "Join Our Platform"}
            </h1>
            <p className="text-sm text-center text-gray-500">
              {isTextDataSubmited && "(Max 200KB image)"}
            </p>
          </div>

          <form onSubmit={onSubmitHandler} className="px-6 sm:px-8 pb-6 space-y-4">
            {state === "Sign Up" && isTextDataSubmited ? (
              <div className="flex flex-col items-center my-6">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4 overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer">
                  {image ? (
                    <div className="relative w-full h-full group">
                      <img src={URL.createObjectURL(image)} alt="Logo" className="object-cover w-full h-full" />
                      <div 
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 opacity-0 group-hover:opacity-100"
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
            ) : (
              <>
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
                        placeholder="Enter your phone number"
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
                      onChange={handlePasswordChange}
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
              </>
            )}

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
              className="w-full py-3.5 mt-4 font-medium text-white rounded-xl"
              style={{ backgroundColor: '#FF0000' }}
            >
              {isLoading ? "Processing..." : state === "Login" ? "Sign In" : isTextDataSubmited ? "Create Account" : "Continue"}
            </button>
          </form>

          <div className="py-4 bg-gray-50 border-t border-gray-100 rounded-b-3xl">
            <div className="flex justify-center px-6">
              <p className="text-sm text-gray-600">
                {state === "Login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setState(state === "Login" ? "Sign Up" : "Login")}
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