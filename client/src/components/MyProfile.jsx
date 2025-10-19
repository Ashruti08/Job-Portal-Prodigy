import React, { useContext, useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, File, Edit, Download, User, Briefcase, Upload, Save, RefreshCw, Home, X, Check, Trash2 } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { useNavigate, useLocation } from "react-router-dom";

const MyProfile = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { backendUrl, userData, fetchUserData } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Resume states
  const [isEditResume, setIsEditResume] = useState(false);
  const [resume, setResume] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Section editing states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingProfessional, setIsEditingProfessional] = useState(false);
  
  // Profile form states
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
    instagramId: '',
    facebookId: '',
    
    // Professional Details
    currentDesignation: '',
    currentDepartment: '',
    currentCTC: '',
    expectedCTC: '',
    noticePeriod: '',
    totalExperience: '',
    roleType: 'Full Time',
    jobChangeStatus: '',
    sector: '',
    category: '',
    otherSector: '',
    otherCategory: ''
  });

  // Circular Progress Component
  const CircularProgress = ({ percentage, label, size = 120 }) => {
    const radius = (size - 10) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const isComplete = percentage === 100;

    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isComplete ? "#10B981" : "#FF0000"}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${isComplete ? 'text-green-600' : 'text-red-600'}`}>
                {percentage}%
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium text-gray-700 text-center">{label}</p>
      </div>
    );
  };

  // Calculate completion percentages
  const calculatePersonalCompletion = () => {
    const personalFields = [
      profileData.firstName,
      profileData.surname,
      profileData.mobileNo,
      profileData.emailId,
      profileData.city,
      profileData.state,
      profileData.languages,
      profileData.maritalStatus,
      profileData.instagramId,
      profileData.facebookId
    ];
    const filledFields = personalFields.filter(field => field && field.trim() !== '').length;
    return Math.round((filledFields / personalFields.length) * 100);
  };

  const calculateProfessionalCompletion = () => {
    const professionalFields = [
      profileData.currentDesignation,
      profileData.currentDepartment,
      profileData.currentCTC,
      profileData.expectedCTC,
      profileData.noticePeriod,
      profileData.totalExperience,
      profileData.jobChangeStatus,
      profileData.sector === 'Other' ? profileData.otherSector : profileData.sector,
      profileData.category === 'Other' ? profileData.otherCategory : profileData.category
    ];
    const filledFields = professionalFields.filter(field => field && field.toString().trim() !== '').length;
    return Math.round((filledFields / professionalFields.length) * 100);
  };

  const personalCompletion = calculatePersonalCompletion();
  const professionalCompletion = calculateProfessionalCompletion();
  
  // More strict resume check
  const hasResume = userData && userData.resume && 
                   typeof userData.resume === 'string' && 
                   userData.resume.trim() !== '' && 
                   userData.resume !== 'undefined' &&
                   userData.resume !== 'null';
  
  const resumeCompletion = hasResume ? 100 : 0;
  const isProfileIncomplete = personalCompletion < 100 || professionalCompletion < 100 || !hasResume;
  
  console.log('=== Completion Debug ===');
  console.log('hasResume:', hasResume);
  console.log('resumeCompletion:', resumeCompletion);
  console.log('userData?.resume:', userData?.resume);

  // Resume utility functions
  const viewResumeFixed = async (resumePath) => {
    if (!resumePath) {
      toast.error('No resume URL provided');
      return;
    }
    const fullUrl = `${backendUrl}${resumePath}`;
    window.open(fullUrl, '_blank');
  };

  const downloadResume = (resumePath, fileName = 'resume.pdf') => {
    if (!resumePath) {
      toast.error('No resume URL provided');
      return;
    }
    const link = document.createElement('a');
    link.href = `${backendUrl}${resumePath}`;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Updated Sector options with Other
  const sectorOptions = [
    'Life Insurance',
    'General Insurance',
    'Equity Broking',
    'Equity Research',
    'Wealth Management',
    'Other'
  ];

  // Updated Category options with Other
  const categoryOptions = [
    'Equity Broking',
    'Commodity Broking',
    'Currency Broking',
    'Fundamental Research',
    'Technical Research',
    'Data Analysis',
    'Quant Analysis',
    'Life Insurance',
    'General Insurance',
    'Asset Finance',
    'Loan Companies',
    'Microfinance MFI',
    'Housing Finance Co. (HFC)',
    'Discretionary Portfolio Management',
    'Non-Discretionary Advisory',
    'Other'
  ];

  const maritalStatusOptions = ['Single', 'Married'];
  const jobChangeStatusOptions = ['Actively Looking', 'Open to Offers', 'Not Looking'];

  useEffect(() => {
    if (userData) {
      console.log('=== Resume Debug ===');
      console.log('userData.resume:', userData.resume);
      console.log('resume type:', typeof userData.resume);
      console.log('resume length:', userData.resume?.length);
      console.log('is truthy:', !!userData.resume);
      
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
        instagramId: userData.instagramId || '',
        facebookId: userData.facebookId || '',
        currentDesignation: userData.currentDesignation || '',
        currentDepartment: userData.currentDepartment || '',
        currentCTC: userData.currentCTC || '',
        expectedCTC: userData.expectedCTC || '',
        noticePeriod: userData.noticePeriod || '',
        totalExperience: userData.totalExperience || '',
        roleType: userData.roleType || 'Full Time',
        jobChangeStatus: userData.jobChangeStatus || '',
        sector: userData.sector || '',
        category: userData.category || '',
        otherSector: userData.otherSector || '',
        otherCategory: userData.otherCategory || ''
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

  const handleResumeSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed for resume');
      e.target.value = '';
      return;
    }
    
    if (file.size > 512000) {
      toast.error('Resume size must be less than 500KB');
      e.target.value = '';
      return;
    }
    
    setResume(file);
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

  // Delete resume function
  const deleteResume = async () => {
    if (!window.confirm("Are you sure you want to delete your resume? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = await getToken();

      const response = await fetch(`${backendUrl}/api/users/delete-resume`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Resume deleted successfully!");
        await fetchUserData();
        setIsEditResume(false);
      } else {
        toast.error(data.message || "Failed to delete resume.");
      }
    } catch (error) {
      console.error("Delete resume error:", error);
      toast.error("Failed to delete resume. Please try again.");
    }
    
    setIsDeleting(false);
  };

  // Autofill from resume function
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
      
      if (data.success && data.extractedData) {
        setProfileData(prev => ({
          ...prev,
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
        }));
        
        setIsEditingPersonal(true);
        setIsEditingProfessional(true);
        toast.success(data.message || "Details autofilled from resume! Please review and save.");
      } else {
        toast.error(data.message || "Failed to extract data from resume.");
      }
    } catch (error) {
      console.error("Autofill error:", error);
      toast.error("Failed to extract data from resume.");
    }
    
    setIsLoading(false);
  };

  const savePersonalDetails = async () => {
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
        toast.success("Personal details updated successfully!");
        await fetchUserData();
        setIsEditingPersonal(false);
      } else {
        toast.error(data.message || "Failed to update personal details.");
      }
    } catch (error) {
      toast.error("Failed to update personal details. Please try again.");
    }
    setIsLoading(false);
  };

  const saveProfessionalDetails = async () => {
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
        toast.success("Professional details updated successfully!");
        await fetchUserData();
        setIsEditingProfessional(false);
      } else {
        toast.error(data.message || "Failed to update professional details.");
      }
    } catch (error) {
      toast.error("Failed to update professional details. Please try again.");
    }
    setIsLoading(false);
  };

  const cancelPersonalEdit = () => {
    setIsEditingPersonal(false);
    if (userData) {
      setProfileData(prev => ({
        ...prev,
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
        instagramId: userData.instagramId || '',
        facebookId: userData.facebookId || ''
      }));
    }
  };

  const cancelProfessionalEdit = () => {
    setIsEditingProfessional(false);
    if (userData) {
      setProfileData(prev => ({
        ...prev,
        currentDesignation: userData.currentDesignation || '',
        currentDepartment: userData.currentDepartment || '',
        currentCTC: userData.currentCTC || '',
        expectedCTC: userData.expectedCTC || '',
        noticePeriod: userData.noticePeriod || '',
        totalExperience: userData.totalExperience || '',
        roleType: userData.roleType || 'Full Time',
        jobChangeStatus: userData.jobChangeStatus || '',
        sector: userData.sector || '',
        category: userData.category || '',
        otherSector: userData.otherSector || '',
        otherCategory: userData.otherCategory || ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)' }}></div>
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse delay-1000" style={{ backgroundColor: 'rgba(2, 3, 48, 0.1)' }}></div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Incomplete Profile Message - Simple one line */}
        {isProfileIncomplete && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-orange-500 rounded-lg p-4 shadow-md"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-orange-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium text-orange-800">
                Complete your profile to increase visibility to recruiters and get better job opportunities.
              </p>
            </div>
          </motion.div>
        )}

        {/* Profile Overview with Progress Bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 p-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#020330' }}>Profile Completion</h2>
            <p className="text-gray-600">Complete your profile to increase visibility to recruiters</p>
          </div>
          
          {/* Three Progress Circles in a Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Personal Details Progress */}
            <div className="flex flex-col items-center">
              <CircularProgress percentage={personalCompletion} label="" size={140} />
              <h3 className="mt-4 text-lg font-semibold" style={{ color: '#020330' }}>Personal Details</h3>
              <p className="text-sm text-gray-500 text-center mt-1">Basic information</p>
            </div>
            
            {/* Professional Details Progress */}
            <div className="flex flex-col items-center">
              <CircularProgress percentage={professionalCompletion} label="" size={140} />
              <h3 className="mt-4 text-lg font-semibold" style={{ color: '#020330' }}>Professional Details</h3>
              <p className="text-sm text-gray-500 text-center mt-1">Work experience & preferences</p>
            </div>
            
            {/* Resume Progress */}
            <div className="flex flex-col items-center">
              <CircularProgress percentage={resumeCompletion} label="" size={140} />
              <h3 className="mt-4 text-lg font-semibold" style={{ color: '#020330' }}>Resume</h3>
              <p className="text-sm text-gray-500 text-center mt-1">
                {resumeCompletion === 100 ? 'Uploaded ✓' : 'Not uploaded'}
              </p>
            </div>
          </div>
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
              {isEditResume || !hasResume ? (
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
                      onChange={handleResumeSelect}
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

                  <motion.button
                    onClick={deleteResume}
                    disabled={isDeleting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center px-6 py-3 font-medium rounded-lg transition-all duration-200 shadow-lg ${
                      isDeleting 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:shadow-red-500/25'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Resume'}
                  </motion.button>
                  
                  <p className="text-gray-600">Keep your profile updated (Max 500KB PDF)</p>
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
              
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg"
                    style={{ background: "#FF0000" }}
                  >
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold" style={{ color: '#020330' }}>Personal Details</h3>
                    <p className="text-sm text-gray-500 mt-1">Basic information about yourself</p>
                  </div>
                </div>
                
                {/* Edit/Save Buttons */}
                <div className="flex gap-2">
                  {!isEditingPersonal ? (
                    <motion.button
                      onClick={() => setIsEditingPersonal(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center px-5 py-2.5 text-white font-medium rounded-lg transition-all duration-200 shadow-md"
                      style={{ background: "#FF0000" }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        onClick={savePersonalDetails}
                        disabled={isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center px-5 py-2.5 font-medium rounded-lg transition-all duration-200 shadow-md ${
                          isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-white'
                        }`}
                        style={!isLoading ? { background: "#10B981" } : {}}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </motion.button>
                      <motion.button
                        onClick={cancelPersonalEdit}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center px-5 py-2.5 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditingPersonal}
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
                    disabled={!isEditingPersonal}
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
                    disabled={!isEditingPersonal}
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
                    disabled={!isEditingPersonal}
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
                    disabled={!isEditingPersonal}
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
                    disabled={!isEditingPersonal}
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
                    disabled={!isEditingPersonal}
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
                    disabled={!isEditingPersonal}
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
                    disabled={!isEditingPersonal}
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
                    disabled={!isEditingPersonal}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Status</option>
                    {maritalStatusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram ID</label>
                  <input
                    type="url"
                    name="instagramId"
                    value={profileData.instagramId}
                    onChange={handleInputChange}
                    disabled={!isEditingPersonal}
                    placeholder="https://instagram.com/username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facebook ID</label>
                  <input
                    type="url"
                    name="facebookId"
                    value={profileData.facebookId}
                    onChange={handleInputChange}
                    disabled={!isEditingPersonal}
                    placeholder="https://facebook.com/username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
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
              
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg"
                    style={{ background: "#FF0000" }}
                  >
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold" style={{ color: '#020330' }}>Professional Details</h3>
                    <p className="text-sm text-gray-500 mt-1">Your work experience and career preferences</p>
                  </div>
                </div>
                
                {/* Edit/Save Buttons */}
                <div className="flex gap-2">
                  {!isEditingProfessional ? (
                    <motion.button
                      onClick={() => setIsEditingProfessional(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center px-5 py-2.5 text-white font-medium rounded-lg transition-all duration-200 shadow-md"
                      style={{ background: "#FF0000" }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        onClick={saveProfessionalDetails}
                        disabled={isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center px-5 py-2.5 font-medium rounded-lg transition-all duration-200 shadow-md ${
                          isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-white'
                        }`}
                        style={!isLoading ? { background: "#10B981" } : {}}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </motion.button>
                      <motion.button
                        onClick={cancelProfessionalEdit}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center px-5 py-2.5 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Designation</label>
                  <input
                    type="text"
                    name="currentDesignation"
                    value={profileData.currentDesignation}
                    onChange={handleInputChange}
                    disabled={!isEditingProfessional}
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
                    disabled={!isEditingProfessional}
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
                    disabled={!isEditingProfessional}
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
                    disabled={!isEditingProfessional}
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
                    disabled={!isEditingProfessional}
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
                    disabled={!isEditingProfessional}
                    placeholder="e.g., 3 years"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Type</label>
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 flex items-center">
                    Full Time
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Change Status</label>
                  <select
                    name="jobChangeStatus"
                    value={profileData.jobChangeStatus}
                    onChange={handleInputChange}
                    disabled={!isEditingProfessional}
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
                    disabled={!isEditingProfessional}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Sector</option>
                    {sectorOptions.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>

                {/* Other Sector Input - Shows when "Other" is selected */}
                {profileData.sector === 'Other' && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Please specify your sector</label>
                    <input
                      type="text"
                      name="otherSector"
                      value={profileData.otherSector}
                      onChange={handleInputChange}
                      disabled={!isEditingProfessional}
                      placeholder="Enter your sector"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={profileData.category}
                    onChange={handleInputChange}
                    disabled={!isEditingProfessional}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Category</option>
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Other Category Input - Shows when "Other" is selected */}
                {profileData.category === 'Other' && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Please specify your category</label>
                    <input
                      type="text"
                      name="otherCategory"
                      value={profileData.otherCategory}
                      onChange={handleInputChange}
                      disabled={!isEditingProfessional}
                      placeholder="Enter your category"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MyProfile;