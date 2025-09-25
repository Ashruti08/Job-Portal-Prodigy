import { useState } from "react";
import { Home } from "lucide-react";
import { useContext } from "react";
import axios from 'axios'; // Make sure you have axios installed
import { AppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";

const JobAlert = () => {
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
 const { backendUrl, companyToken } = useContext(AppContext);
  
  const handleHomeClick = () => {
    window.location.href = '/';
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
    // Add more Indian cities as needed
  ];

  const experiences = [
    "Beginner Level",
    "Intermediate level", 
    "Senior level",
   
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email) {
      setMessage('Email is required');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // Replace with your actual backend URL
      const data = await axios.post(backendUrl+"/api/job-alerts", formData,
          { 
          headers: { 
            token: companyToken,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      setMessage('Job alert created successfully! You will receive notifications based on your preferences.');
      
      // Reset form
      setFormData({
        email: '',
        phone: '',
        category: '',
        location: '',
        level: '',
        designation: '',
        frequency: 'daily'
      });
      

    } catch (error) {
      console.error('Error creating job alert:', error);
      setMessage('Error creating job alert. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
    
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <Navbar/>
      
      {/* Hero Section with Form */}
      <div className="bg-white py-12 px-8">
        <div className="max-w-6xl mx-auto text-center">
          {/* Header Content */}
          <div className="text-center mb-12">
            <p className="text-sm font-medium tracking-wider mb-4 text-red-600">
              STAY UPDATED
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#022030" }}>
               Job alert
            </h1>
            {/* <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get personalized job alerts delivered to your inbox. Never miss out on the perfect opportunity in the financial services industry.
            </p> */}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12">
            
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
                  disabled={isSubmitting}
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
                      <span>Create Job Alert</span>
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  You'll receive email notifications for new job opportunities matching your preferences.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobAlert;