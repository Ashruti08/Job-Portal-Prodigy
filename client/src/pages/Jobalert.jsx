import { useState, useEffect } from "react";
import { Home, X, CheckCircle, AlertCircle } from "lucide-react";
import { useClerk, useUser } from "@clerk/clerk-react";
import axios from 'axios';
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-xl shadow-2xl ${
        type === 'success' 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        {type === 'success' ? (
          <CheckCircle className="w-6 h-6 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
        )}
        <p className="flex-1 font-medium">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const JobAlert = () => {
  const navigate = useNavigate();
  const { openSignIn } = useClerk();
  const { user, isLoaded } = useUser();
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    category: '',
    location: '',
    level: '',
    designation: '',
    frequency: 'daily'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState({ message: '', type: 'success' });
  const { backendUrl, companyToken } = useContext(AppContext);
  
  // Check if user is logged in with Clerk
  const isLoggedIn = isLoaded && user;

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (isLoggedIn && user.primaryEmailAddress) {
      setFormData(prev => ({
        ...prev,
        email: user.primaryEmailAddress.emailAddress
      }));
    }
  }, [isLoggedIn, user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const showToastNotification = (message, type = 'success') => {
    setToastConfig({ message, type });
    setShowToast(true);
  };

  const JobCategories = [
    "Equity Broking",
    "Commodity Broking",
    "Currency Broking",
    "Fundamental Research",
    "Technical Research",
    "Data Analysis",
    "Quant Analysis",
    "Life Insurance",
    "General Insurance",
    "Asset Finance",
    "Loan Companies",
    "Microfiance",
    "MFI",
    "Housing Finance Co. (HFC)",
    "Discretionary Portfolio Management",
    "Non-Discretionary Advisory"
  ];

  const JobDesignation = [
    "Branch Manager",
    "Sr. Branch Manager",
    "Area Manager",
    "Cluster Manager",
    "Regional Manager",
    "Zonal Manager",
    "National Head",
    "Trader",
    "Research Analyst",
    "Senior Research Analyst",
    "Operations Executive",
    "Operations Manager",
    "Head of Operations",
    "Institutional Sales",
    "Compliance Officer",
    "Executive",
    "Sr. Executive",
    "Asst. Manager",
    "Manager",
    "Sr. Manager",
    "Asst. Vice President(AVP)",
    "Vice President(VP)",
    "Chief Executive Officer(CEO)",
    "Chief Operation Officer(COO)",
    "Chief Finance Officer(CFO)",
    "Chief Technical Officer(CTO)",
    "Chief Marketing Officer(CMO)",
    "Chief Revenue Officer(CRO)",
    "Chief Human Resource Officer(CHRO)",
    "Dealer-Equity",
    "Dealer-Commodity",
    "Dealer-Currency",
    "Relationship Executive(RE)",
    "Relationship Manager(RM)",
    "Sales Manager",
    "Sr. Sales Manager",
    "Asst. Branch Manager(ABM)"
  ];

  const locations = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", 
    "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Kanpur", "Nagpur",
    "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad",
    "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik",
  ];

  const experiences = [
    "Beginner Level",
    "Intermediate level", 
    "Senior level",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!isLoggedIn) {
      showToastNotification('Please login to create job alerts', 'error');
      setMessage('Please login to create job alerts');
      setTimeout(() => {
        openSignIn();
      }, 1500);
      return;
    }

    if (!formData.email) {
      setMessage('Email is required');
      showToastNotification('Email is required', 'error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const data = await axios.post(backendUrl + "/api/job-alerts", formData,
        { 
          headers: { 
            token: companyToken,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      const successMessage = 'Job alert created successfully! You will receive notifications based on your preferences.';
      setMessage(successMessage);
      showToastNotification('Job alert created successfully!', 'success');
      
      // Reset form but keep email
      setFormData({
        email: user.primaryEmailAddress?.emailAddress || '',
        phone: '',
        category: '',
        location: '',
        level: '',
        designation: '',
        frequency: 'daily'
      });

    } catch (error) {
      console.error('Error creating job alert:', error);
      const errorMessage = error.response?.data?.message || 'Error creating job alert. Please try again.';
      setMessage(errorMessage);
      showToastNotification(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Header Section */}
      <Navbar />
      
      {/* Hero Section with Form */}
      <div className="bg-white py-12 px-8">
        <div className="max-w-6xl mx-auto text-center">
          {/* Header Content */}
          <div className="text-center mb-12">
            <p className="text-sm font-medium tracking-wider mb-4 text-red-600">
              STAY UPDATED
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#022030" }}>
              Job Alert
            </h1>
          </div>

          {/* Login Required Message (if not logged in) */}
          {!isLoggedIn && isLoaded && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-yellow-800">Login Required</h3>
              </div>
              <p className="text-yellow-700 mb-4">
                You need to be logged in to create job alerts and receive personalized notifications.
              </p>
              <button
                onClick={() => openSignIn()}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Login to Continue
              </button>
            </div>
          )}

          {/* Form Card */}
          <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12 ${!isLoggedIn ? 'opacity-50 pointer-events-none' : ''}`}>
            
            {/* Success/Error Message */}
            {message && (
              <div className={`mb-8 p-4 rounded-xl ${
                message.includes('successfully') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-gray-400 transition-colors duration-200 bg-gray-50 focus:bg-white"
                      disabled={!isLoggedIn}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-3">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-gray-400 transition-colors duration-200 bg-gray-50 focus:bg-white"
                      disabled={!isLoggedIn}
                    />
                  </div>
                </div>
              </div>

              {/* Job Preferences Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3">
                  Job Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-3">
                      Job Category
                    </label>
                    <select
                      name="category"
                      id="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-gray-50 focus:bg-white hover:border-gray-400 transition-colors duration-200"
                      disabled={!isLoggedIn}
                    >
                      <option value="">Select a category</option>
                      {JobCategories.map((category, index) => (
                        <option key={index} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-3">
                      Preferred Location
                    </label>
                    <select
                      name="location"
                      id="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-gray-50 focus:bg-white hover:border-gray-400 transition-colors duration-200"
                      disabled={!isLoggedIn}
                    >
                      <option value="">Select a location</option>
                      {locations.map((location, index) => (
                        <option key={index} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="level" className="block text-sm font-semibold text-gray-700 mb-3">
                      Experience Level
                    </label>
                    <select
                      name="level"
                      id="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-gray-50 focus:bg-white hover:border-gray-400 transition-colors duration-200"
                      disabled={!isLoggedIn}
                    >
                      <option value="">Select experience level</option>
                      {experiences.map((exp, index) => (
                        <option key={index} value={exp}>
                          {exp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="designation" className="block text-sm font-semibold text-gray-700 mb-3">
                      Job Designation
                    </label>
                    <select
                      name="designation"
                      id="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-gray-50 focus:bg-white hover:border-gray-400 transition-colors duration-200"
                      disabled={!isLoggedIn}
                    >
                      <option value="">Select a designation</option>
                      {JobDesignation.map((designation, index) => (
                        <option key={index} value={designation}>
                          {designation}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Alert Settings Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3">
                  Alert Settings
                </h3>
                <div className="max-w-md">
                  <label htmlFor="frequency" className="block text-sm font-semibold text-gray-700 mb-3">
                    Notification Frequency
                  </label>
                  <select
                    name="frequency"
                    id="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-gray-50 focus:bg-white hover:border-gray-400 transition-colors duration-200"
                    disabled={!isLoggedIn}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting || !isLoggedIn}
                  className="w-full md:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Creating Alert...</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C10.3431 2 9 3.34315 9 5V6.084C6.16263 7.16514 4 9.93319 4 13V17L2 19V20H22V19L20 17V13C20 9.93319 17.8374 7.16514 15 6.084V5C15 3.34315 13.6569 2 12 2Z" fill="white"/>
                        <path d="M8.99999 20C8.99999 21.1046 9.89544 22 10.9999 22H13.0001C14.1046 22 15 21.1046 15 20H8.99999Z" fill="white"/>
                      </svg>
                      <span>{isLoggedIn ? 'Create Job Alert' : 'Login Required'}</span>
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  {isLoggedIn 
                    ? "You'll receive email notifications for new job opportunities matching your preferences."
                    : "Please login to create job alerts and receive notifications."
                  }
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default JobAlert;