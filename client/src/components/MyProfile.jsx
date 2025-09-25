import React, { useContext, useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, File, Edit, Download, User, Briefcase, Upload, Save, RefreshCw, Home } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const MyProfile = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { backendUrl, userData, fetchUserData } = useContext(AppContext);
  const navigate = useNavigate();
  
  // Resume states
  const [isEditResume, setIsEditResume] = useState(false);
  const [resume, setResume] = useState(null);
  
  // Profile form states
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    // Personal Details
    firstName: '',
    middleName: '',
    surname: '',
    mobileNo: '',
    emailId: '',
    linkedinId: '',
    city: '',
    state: '',
    languages: '',
    maritalStatus: '',
    
    // Professional Details
    currentDesignation: '',
    currentDepartment: '',
    currentCTC: '',
    expectedCTC: '',
    noticePeriod: '',
    totalExperience: '',
    roleType: '', // Broker Role/Company Role
    jobChangeStatus: '',
    sector: '',
    category: ''
  });

  // Resume utility functions
  const testPDFUrl = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const viewResumeFixed = async (cloudinaryUrl) => {
    if (!cloudinaryUrl) {
      toast.error('No resume URL provided');
      return;
    }
    
    // Test the URL first
    const isWorking = await testPDFUrl(cloudinaryUrl);
    if (isWorking) {
      window.open(cloudinaryUrl, '_blank');
    } else {
      toast.error('PDF cannot be accessed. Please enable "PDF and ZIP files delivery" in your Cloudinary Dashboard → Settings → Security');
    }
  };

  const downloadResume = (cloudinaryUrl, fileName = 'resume.pdf') => {
    if (!cloudinaryUrl) {
      toast.error('No resume URL provided');
      return;
    }
    
    const link = document.createElement('a');
    link.href = cloudinaryUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-side PDF parsing for autofill
  const parseResumeClientSide = async (resumeUrl) => {
    try {
      // For now, skip client-side parsing and go directly to server-side
      // This avoids the JSON parsing issues
      throw new Error('Using server-side parsing');
      
    } catch (error) {
      throw error;
    }
  };

  // Parse resume text
  const parseResumeText = (text) => {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Extract basic information using regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    
    // Extract name (usually first line or after keywords)
    const extractName = () => {
      const lines = cleanText.split('\n').filter(line => line.trim());
      const firstLine = lines[0]?.trim();
      
      // If first line looks like a name (2-4 words, mostly letters)
      const namePattern = /^[A-Za-z\s]{2,50}$/;
      if (firstLine && namePattern.test(firstLine)) {
        return firstLine;
      }
      return firstLine || '';
    };

    // Extract sections
    const extractSections = () => {
      const sections = {};
      const sectionKeywords = {
        summary: ['summary', 'profile', 'objective', 'about'],
        experience: ['experience', 'work history', 'employment', 'career'],
        education: ['education', 'academic', 'qualification', 'degree'],
        skills: ['skills', 'technical skills', 'competencies', 'technologies']
      };
      
      for (const [sectionName, keywords] of Object.entries(sectionKeywords)) {
        for (const keyword of keywords) {
          const regex = new RegExp(
            `(${keyword}[:\\s]*)(.*?)(?=\\n\\s*(?:${Object.values(sectionKeywords).flat().join('|')})|$)`, 
            'gis'
          );
          const match = cleanText.match(regex);
          if (match && match[2]) {
            sections[sectionName] = match[2].trim();
            break;
          }
        }
      }
      return sections;
    };

    const sections = extractSections();
    const fullName = extractName();
    const nameParts = fullName.split(' ');
    
    return {
      // Map to your form fields
      firstName: nameParts[0] || '',
      middleName: nameParts.length > 2 ? nameParts[1] : '',
      surname: nameParts[nameParts.length - 1] !== nameParts[0] ? nameParts[nameParts.length - 1] : '',
      emailId: (cleanText.match(emailRegex) || [])[0] || '',
      mobileNo: (cleanText.match(phoneRegex) || [])[0] || '',
      
      // Professional fields (basic extraction)
      currentDesignation: sections.experience ? sections.experience.split(' ')[0] || '' : '',
      totalExperience: '', // You can add logic to extract years
      
      // Raw data for manual review
      extractedText: cleanText,
      sections: sections
    };
  };

  // Sector options (from job listing)
  const sectorOptions = [
    'IT/Software',
    'Banking/Financial Services',
    'Healthcare',
    'Education',
    'Manufacturing',
    'Retail',
    'Real Estate',
    'Consulting',
    'Media/Entertainment',
    'Government/Public Sector',
    'Non-Profit',
    'Other'
  ];

  // Category options (from job listing)
  const categoryOptions = [
    'Full-time',
    'Part-time',
    'Contract',
    'Freelance',
    'Internship',
    'Remote',
    'Hybrid'
  ];

  const maritalStatusOptions = ['Single', 'Married'];
  const roleTypeOptions = ['Broker Role', 'Company Role'];
  const jobChangeStatusOptions = ['Actively Looking', 'Open to Offers', 'Not Looking'];

  useEffect(() => {
    if (userData) {
      setProfileData({
        firstName: userData.firstName || '',
        middleName: userData.middleName || '',
        surname: userData.surname || '',
        mobileNo: userData.mobileNo || '',
        emailId: userData.emailId || user?.primaryEmailAddress?.emailAddress || '',
        linkedinId: userData.linkedinId || '',
        city: userData.city || '',
        state: userData.state || '',
        languages: userData.languages || '',
        maritalStatus: userData.maritalStatus || '',
        currentDesignation: userData.currentDesignation || '',
        currentDepartment: userData.currentDepartment || '',
        currentCTC: userData.currentCTC || '',
        expectedCTC: userData.expectedCTC || '',
        noticePeriod: userData.noticePeriod || '',
        totalExperience: userData.totalExperience || '',
        roleType: userData.roleType || '',
        jobChangeStatus: userData.jobChangeStatus || '',
        sector: userData.sector || '',
        category: userData.category || ''
      });
    }
  }, [userData, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateResume = async () => {
    try {
      if (!resume) {
        toast.error("Please select a resume file.");
        return;
      }

      const formData = new FormData();
      formData.append("resume", resume);

      const token = await getToken();

      const response = await fetch(`${backendUrl}/api/users/update-resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        await fetchUserData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to update resume. Please try again.");
    }

    setIsEditResume(false);
    setResume(null);
  };

  // Autofill from resume function
// Updated autofillFromResume function in your MyProfile component
const autofillFromResume = async () => {
  if (!userData?.resume) {
    toast.error("Please upload a resume first to autofill details.");
    return;
  }

  setIsLoading(true);
  try {
    const token = await getToken();
    const response = await fetch(`${backendUrl}/api/users/extract-resume-data`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resumeUrl: userData.resume })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Autofill API Response:", data); // Debug log
    
    if (data.success && data.extractedData) {
      // Log the extracted data to debug
      console.log("Extracted Data:", data.extractedData);
      
      // Update the profile data state - this was the missing piece
      setProfileData(prev => {
        const updatedData = {
          ...prev,
          // Only update fields that have non-empty values
          ...(data.extractedData.firstName && { firstName: data.extractedData.firstName }),
          ...(data.extractedData.middleName && { middleName: data.extractedData.middleName }),
          ...(data.extractedData.surname && { surname: data.extractedData.surname }),
          ...(data.extractedData.emailId && { emailId: data.extractedData.emailId }),
          ...(data.extractedData.mobileNo && { mobileNo: data.extractedData.mobileNo }),
          ...(data.extractedData.currentDesignation && { currentDesignation: data.extractedData.currentDesignation }),
          ...(data.extractedData.totalExperience && { totalExperience: data.extractedData.totalExperience }),
          ...(data.extractedData.currentDepartment && { currentDepartment: data.extractedData.currentDepartment }),
          ...(data.extractedData.linkedinId && { linkedinId: data.extractedData.linkedinId }),
          ...(data.extractedData.city && { city: data.extractedData.city }),
          ...(data.extractedData.state && { state: data.extractedData.state }),
          ...(data.extractedData.languages && { languages: data.extractedData.languages })
        };
        
        console.log("Updated Profile Data:", updatedData); // Debug log
        return updatedData;
      });
      
      // Make sure editing mode is enabled so user can see the filled fields
      if (!isEditing) {
        setIsEditing(true);
      }
      
      toast.success(data.message || "Details autofilled from resume! Please review and save.");
    } else {
      console.error("API returned success:false or no extractedData:", data);
      toast.error(data.message || "Failed to extract data from resume.");
    }
  } catch (error) {
    console.error("Autofill error:", error);
    if (error.message.includes('404')) {
      toast.error("Backend endpoint not found. Please implement /api/users/extract-resume-data");
    } else {
      toast.error("Failed to extract data from resume. Please check backend implementation.");
    }
  }
  
  setIsLoading(false);
};

  const saveProfile = async () => {
    if (!user) {
      toast.error("Please login to save profile details.");
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      
      if (!token) {
        toast.error("Authentication failed. Please login again.");
        return;
      }

      const response = await fetch(`${backendUrl}/api/users/update-profile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Profile updated successfully!");
        await fetchUserData();
        setIsEditing(false);
      } else {
        toast.error(data.message || "Failed to update profile.");
      }
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)' }}></div>
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse delay-1000" style={{ backgroundColor: 'rgba(2, 3, 48, 0.1)' }}></div>
      
      

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <p className="text-gray-600 text-lg">Manage your personal and professional information</p>
        </motion.div>

        {/* Autofill from Resume Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 group relative"
        >
          <div 
            className="absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: 'linear-gradient(to right, rgba(255, 0, 0, 0.1), rgba(2, 3, 48, 0.1))' }}
          ></div>
          <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 shadow-lg"
                  style={{ background: "#FF0000" }}
                >
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold" style={{ color: '#020330' }}>Smart Autofill</h3>
                  <p className="text-gray-600">Extract details from your resume automatically</p>
                </div>
              </div>
              <motion.button
                onClick={autofillFromResume}
                disabled={isLoading || !userData?.resume}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center px-6 py-3 font-medium rounded-lg transition-all duration-200 shadow-lg ${
                  isLoading || !userData?.resume 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'text-white'
                }`}
                style={!isLoading && userData?.resume ? { 
                  background: "#FF0000",
                  boxShadow: '0 0 20px rgba(255, 0, 0, 0.25)'
                } : {}}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Processing...' : 'Autofill from Resume'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Resume Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 group relative"
        >
          <div 
            className="absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: 'linear-gradient(to right, rgba(255, 0, 0, 0.1), rgba(2, 3, 48, 0.1))' }}
          ></div>
          <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center mb-6">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 shadow-lg"
                style={{ background: "#FF0000" }}
              >
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold" style={{ color: '#020330' }}>Resume Management</h3>
                <p className="text-gray-600">Keep your profile updated</p>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {isEditResume || (userData && !userData.resume) ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-wrap gap-4 items-center"
                >
                  <label className="relative cursor-pointer group">
                    <div className="flex items-center px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-all duration-200">
                      <Download className="w-4 h-4 text-gray-600 mr-2 group-hover:text-gray-800 transition-colors" />
                      <span className="text-gray-600 group-hover:text-gray-800 transition-colors">
                        {resume ? resume.name : "Select Resume"}
                      </span>
                    </div>
                    <input
                      type="file"
                      className="sr-only"
                      accept="application/pdf"
                      onChange={(e) => setResume(e.target.files[0])}
                    />
                  </label>
                  
                  <motion.button
                    onClick={updateResume}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 text-white font-medium rounded-lg transition-all duration-200 shadow-lg"
                    style={{ 
                      background: "#FF0000",
                      boxShadow: '0 0 20px rgba(255, 0, 0, 0.25)'
                    }}
                  >
                    Save Resume
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-wrap gap-4 items-center"
                >
                  <motion.button 
                    onClick={() => viewResumeFixed(userData?.resume)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    View Resume
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setIsEditResume(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center px-6 py-3 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 hover:border-gray-400 hover:text-gray-800 transition-all duration-200"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update Resume
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Personal Details Section */}
          <div className="group relative">
            <div 
              className="absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'linear-gradient(to right, rgba(255, 0, 0, 0.1), rgba(2, 3, 48, 0.1))' }}
            ></div>
            <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-6">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 shadow-lg"
                  style={{ background: "#FF0000" }}
                >
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold" style={{ color: '#020330' }}>Personal Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={profileData.middleName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Surname</label>
                  <input
                    type="text"
                    name="surname"
                    value={profileData.surname}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile No</label>
                  <input
                    type="tel"
                    name="mobileNo"
                    value={profileData.mobileNo}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
                  <input
                    type="email"
                    name="emailId"
                    value={profileData.emailId}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn ID</label>
                  <input
                    type="url"
                    name="linkedinId"
                    value={profileData.linkedinId}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={profileData.state}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                  <input
                    type="text"
                    name="languages"
                    value={profileData.languages}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="English, Hindi, Gujarati"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                  <select
                    name="maritalStatus"
                    value={profileData.maritalStatus}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Status</option>
                    {maritalStatusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details Section */}
          <div className="group relative">
            <div 
              className="absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'linear-gradient(to right, rgba(255, 0, 0, 0.1), rgba(2, 3, 48, 0.1))' }}
            ></div>
            <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-6">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 shadow-lg"
                  style={{ background: "#FF0000" }}
                >
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold" style={{ color: '#020330' }}>Professional Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Designation</label>
                  <input
                    type="text"
                    name="currentDesignation"
                    value={profileData.currentDesignation}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Department</label>
                  <input
                    type="text"
                    name="currentDepartment"
                    value={profileData.currentDepartment}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current CTC</label>
                  <input
                    type="text"
                    name="currentCTC"
                    value={profileData.currentCTC}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g., 5 LPA"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected CTC</label>
                  <input
                    type="text"
                    name="expectedCTC"
                    value={profileData.expectedCTC}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g., 7 LPA"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notice Period</label>
                  <input
                    type="text"
                    name="noticePeriod"
                    value={profileData.noticePeriod}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g., 2 months"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Experience</label>
                  <input
                    type="text"
                    name="totalExperience"
                    value={profileData.totalExperience}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g., 3 years"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Type</label>
                  <select
                    name="roleType"
                    value={profileData.roleType}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Role Type</option>
                    {roleTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Change Status</label>
                  <select
                    name="jobChangeStatus"
                    value={profileData.jobChangeStatus}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Status</option>
                    {jobChangeStatusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                  <select
                    name="sector"
                    value={profileData.sector}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Sector</option>
                    {sectorOptions.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={profileData.category}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Category</option>
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {!isEditing ? (
              <motion.button
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center px-8 py-3 text-white font-medium rounded-lg transition-all duration-200 shadow-lg"
                style={{ 
                  background: "#FF0000",
                  boxShadow: '0 0 20px rgba(255, 0, 0, 0.25)'
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </motion.button>
            ) : (
              <div className="flex gap-4">
                <motion.button
                  onClick={saveProfile}
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center px-8 py-3 font-medium rounded-lg transition-all duration-200 shadow-lg ${
                    isLoading 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'text-white'
                  }`}
                  style={!isLoading ? { 
                    background: "#FF0000",
                    boxShadow: '0 0 20px rgba(255, 0, 0, 0.25)'
                  } : {}}
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </motion.button>

                <motion.button
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data to original userData
                    if (userData) {
                      setProfileData({
                        firstName: userData.firstName || '',
                        middleName: userData.middleName || '',
                        surname: userData.surname || '',
                        mobileNo: userData.mobileNo || '',
                        emailId: userData.emailId || user?.primaryEmailAddress?.emailAddress || '',
                        linkedinId: userData.linkedinId || '',
                        city: userData.city || '',
                        state: userData.state || '',
                        languages: userData.languages || '',
                        maritalStatus: userData.maritalStatus || '',
                        currentDesignation: userData.currentDesignation || '',
                        currentDepartment: userData.currentDepartment || '',
                        currentCTC: userData.currentCTC || '',
                        expectedCTC: userData.expectedCTC || '',
                        noticePeriod: userData.noticePeriod || '',
                        totalExperience: userData.totalExperience || '',
                        roleType: userData.roleType || '',
                        jobChangeStatus: userData.jobChangeStatus || '',
                        sector: userData.sector || '',
                        category: userData.category || ''
                      });
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center px-8 py-3 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 hover:border-gray-400 hover:text-gray-800 transition-all duration-200"
                >
                  Cancel
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MyProfile;