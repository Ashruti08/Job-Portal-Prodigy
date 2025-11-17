import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronRight, ChevronLeft, User, Briefcase, HelpCircle, Check,
  Building, DollarSign, Clock, Target, Heart, Zap, Shield, Users,
  Code, TrendingUp, Mail, Phone, Download
} from "lucide-react";

// Initial form state
const initialFormData = {
  candidateName: '', candidateEmail: '', candidatePhone: '',
  consultancy: '', financialStatus: '', dailyCommute: '', aspirations: '',
  moneyAttitude: '', loyaltyBehavior: '', workStyle: '', pressureHandling: '',
  roleClarityNeed: '', fear1: '', motivation1: '', challenge1: '',
  powerLanguage1: '', companyPriority1: '', targets: '', references: '',
  softwares: '', productKnowledge: '', sourceOfRevenue: ''
};

// Dropdown options
const dropdownOptions = {
  financialStatus: ["Employment & Income", "Household Dependency", "Liabilities / Commitments", "Risk Appetite (Financial Comfort Zone)"],
  dailyCommute: ["By Bus", "By Two Wheeler", "By Four Wheeler", "By Sharing with Friend", "By Auto"],
  aspirations: ["Career Growth & Development", "Work Environment & Culture", "Compensation & Benefits", "Job Role & Responsibilities", "Location & Commute", "Company-Related Factors", "Personal Reasons"],
  fear1: ["Fear of failing again like last job", "Fear of resume instability", "Fear of lack of field support", "Fear of blame for advisor failure"],
  motivation1: ["Wants unlimited earning via incentives", "Wants social recognition", "Wants to outperform peers", "Wants better life for family", "Wants public appreciation"],
  challenge1: ["Advisor retention", "No field support", "Manual processes", "Delayed incentives", "Stuck career path"],
  powerLanguage1: ["Your incentives, your speed — no cap", "Weekly advisor performance reports in app", "Promotion to TL in 6 months", "We never delay commissions", "Field support guaranteed"],
  companyPriority1: ["Stable payout structure", "Lead support + onboarding", "Supportive manager", "Transparent promotion path", "Modern tools (POSP App, CRM)"],
  moneyAttitude: ["Salary is for survival, growth is in incentives.", "work for passion first, money second.", "Money is secondary, work-life balance is primary."],
  loyaltyBehavior: ["I stay loyal if the company values my growth.", "I prefer long-term stability over frequent job changes.", "I am loyal to leaders, not just organizations.", "I am loyal to opportunities, not just companies."],
  workStyle: ["I prefer structured processes and clear guidelines.", "I like working independently with minimal supervision", "I am deadline-driven and work well under pressure.", "I like multitasking across different projects.", "I prioritize speed and efficiency over perfection.", "Prefers fieldwork", "Prefers Office Work"],
  targets: ["I see targets as motivation to push beyond limits.", "I prefer realistic and achievable targets.", "I thrive under aggressive, high-pressure targets.", "I focus on consistent performance rather than chasing big numbers.", "I value team-based targets more than individual ones", "I feel stressed when targets are unrealistic.", "I see targets as guidance, not as pressure."],
  softwares: ["Basic Awareness", "Intermediate Awareness", "Advanced Awareness", "Specialized Awareness", "Expert / Tech-Savvy"],
  productKnowledge: ["Basic Awareness", "Intermediate Awareness", "Advanced Awareness", "Specialized Awareness", "Expert / Tech-Savvy"],
  sourceOfRevenue: ["Personal Network (Warm Leads)", "Cold Calling & Prospecting", "Corporate Tie-Ups & Partnerships", "Events & Seminars", "Digital Marketing", "Channel Partners", "Networking & Community Outreach"],
  pressureHandling: ["Calmness under stress: Not showing frustration even when targets are tight or clients are difficult.", "Prioritization skills: Handling multiple tasks and clients efficiently.", "Problem-solving mindset: Quickly finding solutions instead of panicking.", "Resilience: Bouncing back from failures, rejections, or missed opportunities.", "Decision-making: Making accurate decisions quickly, without overthinking"],
  roleClarityNeed: ["Understanding Responsibilities: Knowing exactly what tasks you are expected to perform daily, weekly, and monthly.", "Knowing Key Metrics: Understanding targets, KPIs, and performance expectations.", "Decision Boundaries: Knowing what decisions you can make independently and what requires approval.", "Reporting Structure: Clear knowledge of who you report to and who reports to you (if applicable).", "Career Path: Awareness of promotion opportunities and skills needed for growth."]
};

const CandidateDetails = ({ isOpen, onClose, profile }) => {
  const { companyToken } = useContext(AppContext);
  const [userRole, setUserRole] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [isExistingAssessment, setIsExistingAssessment] = useState(false);
  const [assessmentData, setAssessmentData] = useState(null);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Check user role from token
  useEffect(() => {
    const checkUserRole = () => {
      if (!companyToken) return;
      
      try {
        const tokenParts = companyToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          
          if (payload.isSubUser && payload.roleType) {
            setUserRole(payload.roleType);
            console.log('Sub-user detected, role:', payload.roleType);
          } else {
            setUserRole(null);
            console.log('Main recruiter - full access');
          }
        }
      } catch (error) {
        console.log('Error decoding token:', error);
        setUserRole(null);
      }
    };
    
    checkUserRole();
  }, [companyToken]);

  // Excel conversion function
  const convertToExcel = (data) => {
    if (typeof window.XLSX === 'undefined') {
      console.error('XLSX library not loaded');
      return null;
    }

    const workbook = window.XLSX.utils.book_new();

    const summaryData = [
      ['CANDIDATE ASSESSMENT REPORT', '', '', ''],
      ['', '', '', ''],
      ['Basic Information', '', '', ''],
      ['Full Name:', data.candidateName || '', '', ''],
      ['Email:', data.candidateEmail || '', '', ''],
      ['Phone:', data.candidatePhone || '', '', ''],
      ['Last Contacted:', formatDate(data.lastUpdated || data.submittedAt), '', ''],
      ['Assessment Status:', data.assessmentStatus || '', '', ''],
      ['', '', '', ''],
      ['ASSESSMENT DETAILS', '', '', ''],
      ['', '', '', ''],
      ['Consultancy Assessment', '', '', ''],
      ['Consultancy:', data.consultancy || '', '', ''],
      ['Financial Status:', data.financialStatus || '', '', ''],
      ['Daily Commute:', data.dailyCommute || '', '', ''],
      ['Aspirations:', data.aspirations || '', '', ''],
      ['Money Attitude:', data.moneyAttitude || '', '', ''],
      ['Loyalty Behavior:', data.loyaltyBehavior || '', '', ''],
      ['Work Style:', data.workStyle || '', '', ''],
      ['Pressure Handling:', data.pressureHandling || '', '', ''],
      ['Role Clarity Need:', data.roleClarityNeed || '', '', ''],
      ['', '', '', ''],
      ['HR Evaluation', '', '', ''],
      ['Fear 1:', data.fear1 || '', '', ''],
      ['Motivation 1:', data.motivation1 || '', '', ''],
      ['Challenge 1:', data.challenge1 || '', '', ''],
      ['Power Language 1:', data.powerLanguage1 || '', '', ''],
      ['Company Priority 1:', data.companyPriority1 || '', '', ''],
      ['', '', '', ''],
      ['Manager Assessment', '', '', ''],
      ['Targets:', data.targets || '', '', ''],
      ['References:', data.references || '', '', ''],
      ['Software Skills:', data.softwares || '', '', ''],
      ['Product Knowledge:', data.productKnowledge || '', '', ''],
      ['Source of Revenue:', data.sourceOfRevenue || '', '', '']
    ];

    const summarySheet = window.XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ width: 25 }, { width: 50 }, { width: 15 }, { width: 15 }];
    window.XLSX.utils.book_append_sheet(workbook, summarySheet, 'Assessment Report');

    const rawData = [
      ['Field', 'Value'],
      ['Candidate Name', data.candidateName || ''],
      ['Email', data.candidateEmail || ''],
      ['Phone', data.candidatePhone || ''],
      ['Last Contacted', formatDate(data.lastUpdated || data.submittedAt)],
      ['Consultancy', data.consultancy || ''],
      ['Financial Status', data.financialStatus || ''],
      ['Daily Commute', data.dailyCommute || ''],
      ['Aspirations', data.aspirations || ''],
      ['Money Attitude', data.moneyAttitude || ''],
      ['Loyalty Behavior', data.loyaltyBehavior || ''],
      ['Work Style', data.workStyle || ''],
      ['Pressure Handling', data.pressureHandling || ''],
      ['Role Clarity Need', data.roleClarityNeed || ''],
      ['Fear 1', data.fear1 || ''],
      ['Motivation 1', data.motivation1 || ''],
      ['Challenge 1', data.challenge1 || ''],
      ['Power Language 1', data.powerLanguage1 || ''],
      ['Company Priority 1', data.companyPriority1 || ''],
      ['Targets', data.targets || ''],
      ['References', data.references || ''],
      ['Software Skills', data.softwares || ''],
      ['Product Knowledge', data.productKnowledge || ''],
      ['Source of Revenue', data.sourceOfRevenue || ''],
      ['Assessment Status', data.assessmentStatus || '']
    ];

    const rawSheet = window.XLSX.utils.aoa_to_sheet(rawData);
    rawSheet['!cols'] = [{ width: 25 }, { width: 60 }];
    window.XLSX.utils.book_append_sheet(workbook, rawSheet, 'Raw Data');

    return workbook;
  };

  const downloadExcel = () => {
    if (!assessmentData) {
      alert('No assessment data available to download');
      return;
    }
    if (typeof window.XLSX === 'undefined') {
      alert('Excel export library not loaded. Please add the XLSX CDN script to your HTML.');
      return;
    }
    try {
      const workbook = convertToExcel(assessmentData);
      if (!workbook) {
        alert('Error creating Excel file');
        return;
      }
      const filename = `${assessmentData.candidateName || 'candidate'}_assessment.xlsx`;
      window.XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error generating Excel file:', error);
      alert('Error generating Excel file. Please try again.');
    }
  };
  
  const fetchExistingAssessment = async (candidateEmail) => {
    if (!candidateEmail) return null;
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/candidates/assessment/email/${candidateEmail}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (response.ok) {
        const result = await response.json();
        return result.assessment;
      } else if (response.status === 404) {
        return null;
      }
      return null;
    } catch (error) {
      console.error('Network error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && profile) {
      const initializeForm = async () => {
        const existingAssessment = await fetchExistingAssessment(profile.email);
        if (existingAssessment) {
          setIsExistingAssessment(true);
          setAssessmentData(existingAssessment);
          setFormData({
            ...initialFormData,
            ...existingAssessment,
            candidateName: profile.name || existingAssessment.candidateName || '',
            candidateEmail: profile.email || existingAssessment.candidateEmail || '',
            candidatePhone: profile.phone || existingAssessment.candidatePhone || ''
          });
        } else {
          setIsExistingAssessment(false);
          setAssessmentData(null);
          setFormData({
            ...initialFormData,
            candidateName: profile.name || '',
            candidateEmail: profile.email || '',
            candidatePhone: profile.phone || ''
          });
        }
        setCurrentStep(1);
      };
      initializeForm();
    }
  }, [isOpen, profile]);

  // Dynamic steps based on user role with cascading access
  const allSteps = [
    { id: 1, title: "Basic Information", icon: User, description: "Candidate contact details", roles: ['all'], editable: ['all'] },
    { id: 2, title: "Consultancy Assessment", icon: Building, description: "Professional evaluation", roles: ['consultancy', 'hr', 'management', null], editable: ['consultancy', null] },
    { id: 3, title: "HR Evaluation", icon: Users, description: "Cultural fit and motivation", roles: ['hr', 'management', null], editable: ['hr', null] },
    { id: 4, title: "Manager Assessment", icon: Target, description: "Technical and business alignment", roles: ['management', null], editable: ['management', null] }
  ];

  const steps = allSteps.filter(step => 
    step.roles.includes('all') || 
    step.roles.includes(userRole) || 
    (userRole === null && step.roles.includes(null))
  );

  // Check if current user can edit a specific step
  const canEditStep = (step) => {
    return step.editable.includes('all') || 
           step.editable.includes(userRole) || 
           (userRole === null && step.editable.includes(null));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => { if (currentStep < steps.length) setCurrentStep(currentStep + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.candidateName || !formData.candidateName.trim()) {
      alert('Please enter candidate name');
      return;
    }

    const filteredData = Object.fromEntries(
      Object.entries(formData).filter(([key, value]) => value && value !== "")
    );
    filteredData.assessmentStatus = 'completed';

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/candidates/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filteredData),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(`Submission failed: ${result.message || 'Unknown error'}`);
      } else {
        alert(result.message || 'Assessment processed successfully!');
        setAssessmentData({...filteredData, lastUpdated: new Date().toISOString()});
        onClose();
      }
    } catch (error) {
      console.error("Network error:", error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFormField = (label, field, type = "text", options = null, icon = null, required = false, readOnly = false) => {
    const IconComponent = icon;
    return (
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent size={16} className="text-gray-500 flex-shrink-0" />}
            <span className="break-words">{label}</span>
            {required && !readOnly && <span className="text-red-500 flex-shrink-0">*</span>}
          </div>
        </label>
        {type === "select" && options ? (
          <select 
            value={formData[field]} 
            onChange={(e) => handleInputChange(field, e.target.value)}
            disabled={readOnly}
            className={`w-full px-4 py-3 border rounded-lg transition-colors text-sm sm:text-base min-h-[44px] ${
              readOnly 
                ? 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed' 
                : 'border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white'
            }`} 
            required={required && !readOnly}>
            <option value="">Select an option</option>
            {options.map((option, index) => (<option key={index} value={option}>{option}</option>))}
          </select>
        ) : type === "textarea" ? (
          <textarea 
            value={formData[field]} 
            onChange={(e) => handleInputChange(field, e.target.value)} 
            rows="3"
            readOnly={readOnly}
            className={`w-full px-4 py-3 border rounded-lg resize-none text-sm sm:text-base ${
              readOnly 
                ? 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed' 
                : 'border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500'
            }`}
            placeholder={readOnly ? '' : `Enter ${label.toLowerCase()}`} 
            required={required && !readOnly} />
        ) : (
          <input 
            type={type} 
            value={formData[field]} 
            onChange={(e) => handleInputChange(field, e.target.value)}
            readOnly={readOnly}
            className={`w-full px-4 py-3 border rounded-lg text-sm sm:text-base min-h-[44px] ${
              readOnly 
                ? 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed' 
                : 'border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500'
            }`}
            placeholder={readOnly ? '' : `Enter ${label.toLowerCase()}`} 
            required={required && !readOnly} />
        )}
      </div>
    );
  };

  const renderStep1 = () => {
    const isReadOnly = !canEditStep(steps[currentStep - 1]);
    
    return (
      <div className="space-y-4">
        {isExistingAssessment && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Check size={16} />
              <span className="text-sm font-medium">Existing Assessment Found</span>
            </div>
            <p className="text-blue-600 text-sm mb-2">You can view and edit the previously submitted assessment data.</p>
            {assessmentData && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <Clock size={14} />
                <span>Last contacted: {formatDate(assessmentData.lastUpdated || assessmentData.submittedAt)}</span>
              </div>
            )}
          </div>
        )}
        
        {isReadOnly && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700">
              <Shield size={16} />
              <span className="text-sm font-medium">This section is read-only for your role</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderFormField("Full Name", "candidateName", "text", null, User, true, isReadOnly)}
          {renderFormField("Email Address", "candidateEmail", "email", null, Mail, false, isReadOnly)}
          {renderFormField("Phone Number", "candidatePhone", "tel", null, Phone, false, isReadOnly)}
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    const isReadOnly = !canEditStep(steps[currentStep - 1]);
    
    return (
      <div className="space-y-4">
        {isReadOnly && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700">
              <Shield size={16} />
              <span className="text-sm font-medium">Consultancy Section (Read-only) - Filled by Consultancy team</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderFormField("Consultancy", "consultancy", "text", null, Building, false, isReadOnly)}
          {renderFormField("Financial Status", "financialStatus", "select", dropdownOptions.financialStatus, DollarSign, false, isReadOnly)}
          {renderFormField("Daily Commute", "dailyCommute", "select", dropdownOptions.dailyCommute, Clock, false, isReadOnly)}
          {renderFormField("Aspirations", "aspirations", "select", dropdownOptions.aspirations, Target, false, isReadOnly)}
          {renderFormField("Money Attitude", "moneyAttitude", "select", dropdownOptions.moneyAttitude, DollarSign, false, isReadOnly)}
          {renderFormField("Loyalty Behavior", "loyaltyBehavior", "select", dropdownOptions.loyaltyBehavior, Heart, false, isReadOnly)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderFormField("Work Style", "workStyle", "select", dropdownOptions.workStyle, Briefcase, false, isReadOnly)}
          {renderFormField("Pressure Handling", "pressureHandling", "select", dropdownOptions.pressureHandling, Shield, false, isReadOnly)}
          {renderFormField("Role Clarity Need", "roleClarityNeed", "select", dropdownOptions.roleClarityNeed, HelpCircle, false, isReadOnly)}
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const isReadOnly = !canEditStep(steps[currentStep - 1]);
    
    return (
      <div className="space-y-4">
        {isReadOnly && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700">
              <Shield size={16} />
              <span className="text-sm font-medium">HR Section (Read-only) - Filled by HR team</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6">
          {renderFormField("Fear 1 - What concerns you most about this role?", "fear1", "select", dropdownOptions.fear1, Shield, false, isReadOnly)}
          {renderFormField("Motivation 1 - What drives you professionally?", "motivation1", "select", dropdownOptions.motivation1, Zap, false, isReadOnly)}
          {renderFormField("Challenge 1 - Describe a significant challenge you overcame", "challenge1", "select", dropdownOptions.challenge1, Target, false, isReadOnly)}
          {renderFormField("Power Language 1 - How do you communicate authority?", "powerLanguage1", "select", dropdownOptions.powerLanguage1, Users, false, isReadOnly)}
          {renderFormField("Company Priority 1 - What's most important in a company?", "companyPriority1", "select", dropdownOptions.companyPriority1, Building, false, isReadOnly)}
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const isReadOnly = !canEditStep(steps[currentStep - 1]);
    
    return (
      <div className="space-y-4">
        {isReadOnly && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700">
              <Shield size={16} />
              <span className="text-sm font-medium">Management Section (Read-only) - Filled by Management team</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderFormField("Targets - What are your key performance goals?", "targets", "select", dropdownOptions.targets, Target, false, isReadOnly)}
          {renderFormField("References", "references", "text", null, Users, false, isReadOnly)}
          {renderFormField("Software Skills", "softwares", "select", dropdownOptions.softwares, Code, false, isReadOnly)}
          {renderFormField("Product Knowledge", "productKnowledge", "select", dropdownOptions.productKnowledge, Briefcase, false, isReadOnly)}
          {renderFormField("Source of Revenue - How will you contribute to revenue?", "sourceOfRevenue", "select", dropdownOptions.sourceOfRevenue, TrendingUp, false, isReadOnly)}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">Candidate Assessment</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
                {isExistingAssessment ? 'Edit Assessment' : 'Comprehensive Evaluation Process'}
                {userRole && <span className="ml-2 text-blue-600">({userRole.toUpperCase()} View)</span>}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 ml-2 flex-shrink-0" aria-label="Close modal">
              <X size={24} />
            </button>
          </div>

          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex sm:hidden items-center justify-center gap-2 mb-3">
              {steps.map((step, idx) => (
                <div key={step.id} className={`h-2 rounded-full transition-all ${
                  currentStep === idx + 1 ? 'w-8 bg-red-500' : currentStep > idx + 1 ? 'w-2 bg-green-500' : 'w-2 bg-gray-300'
                }`} />
              ))}
            </div>
            <div className="sm:hidden text-center">
              <div className="text-sm font-semibold text-red-600">{steps[currentStep - 1].title}</div>
              <div className="text-xs text-gray-500">{steps[currentStep - 1].description}</div>
            </div>
            
            <div className="hidden sm:flex items-center justify-between">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = currentStep === index + 1;
                const isCompleted = currentStep > index + 1;
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                        isActive ? 'bg-red-500 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? <Check size={20} /> : <IconComponent size={20} />}
                      </div>
                      <div className="ml-3 hidden md:block">
                        <div className={`text-sm font-semibold ${isActive ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-gray-500">{step.description}</div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-px mx-2 md:mx-4 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  {currentStep === 1 && renderStep1()}
                  {steps[currentStep - 1]?.id === 2 && renderStep2()}
                  {steps[currentStep - 1]?.id === 3 && renderStep3()}
                  {steps[currentStep - 1]?.id === 4 && renderStep4()}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <button onClick={prevStep} disabled={currentStep === 1 || loading}
              className={`flex items-center justify-center gap-2 px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors order-2 sm:order-1 ${
                currentStep === 1 || loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}>
              <ChevronLeft size={16} /> Previous
            </button>

            <div className="text-sm text-gray-500 text-center order-1 sm:order-2">Step {currentStep} of {steps.length}</div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 order-3">
              {currentStep === steps.length && (assessmentData || isExistingAssessment) && (
                <button onClick={downloadExcel}
                  className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-3 sm:py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors min-h-[44px]"
                  title="Download assessment as Excel file">
                  <Download size={16} /> <span className="sm:inline">Download Excel</span>
                </button>
              )}
              
              {currentStep === steps.length ? (
                <button onClick={handleSubmit} disabled={loading}
                  className="flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 sm:py-2 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]">
                  {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Check size={16} />}
                  {loading ? 'Processing...' : 'Submit Assessment'}
                </button>
              ) : (
                <button onClick={nextStep} disabled={loading}
                  className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-3 sm:py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]">
                  Next <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CandidateDetails;