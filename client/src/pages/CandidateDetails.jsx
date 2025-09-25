import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Briefcase, 
  HelpCircle,
  Check,
  Building,
  DollarSign,
  Clock,
  Target,
  Heart,
  Zap,
  Shield,
  Users,
  Code,
  TrendingUp,
  Mail,
  Phone
} from "lucide-react";

// Define the initial empty state for the form
const initialFormData = {
  // Basic candidate information
  candidateName: '',
  candidateEmail: '',
  candidatePhone: '',
  
  // Step 1: Consultancy Questions
  consultancy: '',
  financialStatus: '',
  dailyCommute: '',
  aspirations: '',
  moneyAttitude: '',
  loyaltyBehavior: '',
  workStyle: '',
  pressureHandling: '',
  roleClarityNeed: '',
  
  // Step 2: Questions for HR
  fear1: '',
  motivation1: '',
  challenge1: '',
  powerLanguage1: '',
  companyPriority1: '',
  
  // Step 3: Questions for Hiring Manager
  targets: '',
  references: '',
  softwares: '',
  productKnowledge: '',
  sourceOfRevenue: ''
};

// Dropdown options (keeping same as before)
const dropdownOptions = {
  financialStatus: [
    "Employment & Income",
    "Household Dependency",
    "Liabilities / Commitments",
    "Risk Appetite (Financial Comfort Zone)"
  ],
  dailyCommute: [
    "By Bus",
    "By Two Wheeler", 
    "By Four Wheeler",
    "By Sharing with Friend",
    "By Auto"
  ],
  aspirations: [
    "Career Growth & Development",
    "Work Environment & Culture",
    "Compensation & Benefits",
    "Job Role & Responsibilities",
    "Location & Commute",
    "Company-Related Factors",
    "Personal Reasons"
  ],
  fear1: [
    "Fear of failing again like last job",
    "Fear of resume instability",
    "Fear of lack of field support",
    "Fear of blame for advisor failure"
  ],
  motivation1: [
    "Wants unlimited earning via incentives",
    "Wants social recognition",
    "Wants to outperform peers",
    "Wants better life for family",
    "Wants public appreciation"
  ],
  challenge1: [
    "Advisor retention",
    "No field support",
    "Manual processes",
    "Delayed incentives",
    "Stuck career path"
  ],
  powerLanguage1: [
    "Your incentives, your speed — no cap",
    "Weekly advisor performance reports in app",
    "Promotion to TL in 6 months",
    "We never delay commissions",
    "Field support guaranteed"
  ],
  companyPriority1: [
    "Stable payout structure",
    "Lead support + onboarding",
    "Supportive manager",
    "Transparent promotion path",
    "Modern tools (POSP App, CRM)"
  ],
  moneyAttitude: [
    "Salary is for survival, growth is in incentives.",
    "work for passion first, money second.",
    "Money is secondary, work-life balance is primary."
  ],
  loyaltyBehavior: [
    "I stay loyal if the company values my growth.",
    "I prefer long-term stability over frequent job changes.",
    "I am loyal to leaders, not just organizations.",
    "I am loyal to opportunities, not just companies."
  ],
  workStyle: [
    "I prefer structured processes and clear guidelines.",
    "I like working independently with minimal supervision",
    "I am deadline-driven and work well under pressure.",
    "I like multitasking across different projects.",
    "I prioritize speed and efficiency over perfection.",
    "Prefers fieldwork",
    "Prefers Office Work"
  ],
  targets: [
    "I see targets as motivation to push beyond limits.",
    "I prefer realistic and achievable targets.",
    "I thrive under aggressive, high-pressure targets.",
    "I focus on consistent performance rather than chasing big numbers.",
    "I value team-based targets more than individual ones",
    "I feel stressed when targets are unrealistic.",
    "I see targets as guidance, not as pressure."
  ],
  softwares: [
    "Basic Awareness",
    "Intermediate Awareness", 
    "Advanced Awareness",
    "Specialized Awareness",
    "Expert / Tech-Savvy"
  ],
  productKnowledge: [
    "Basic Awareness",
    "Intermediate Awareness",
    "Advanced Awareness", 
    "Specialized Awareness",
    "Expert / Tech-Savvy"
  ],
  sourceOfRevenue: [
    "Personal Network (Warm Leads)",
    "Cold Calling & Prospecting",
    "Corporate Tie-Ups & Partnerships",
    "Events & Seminars",
    "Digital Marketing",
    "Channel Partners",
    "Networking & Community Outreach"
  ],
  pressureHandling: [
    "Calmness under stress: Not showing frustration even when targets are tight or clients are difficult.",
    "Prioritization skills: Handling multiple tasks and clients efficiently.",
    "Problem-solving mindset: Quickly finding solutions instead of panicking.",
    "Resilience: Bouncing back from failures, rejections, or missed opportunities.",
    "Decision-making: Making accurate decisions quickly, without overthinking"
  ],
  roleClarityNeed: [
    "Understanding Responsibilities: Knowing exactly what tasks you are expected to perform daily, weekly, and monthly.",
    "Knowing Key Metrics: Understanding targets, KPIs, and performance expectations.",
    "Decision Boundaries: Knowing what decisions you can make independently and what requires approval.",
    "Reporting Structure: Clear knowledge of who you report to and who reports to you (if applicable).",
    "Career Path: Awareness of promotion opportunities and skills needed for growth."
  ]
};

const CandidateDetails = ({ isOpen, onClose, profile }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [isExistingAssessment, setIsExistingAssessment] = useState(false);

  // Function to fetch existing assessment data
  const fetchExistingAssessment = async (candidateEmail) => {
    if (!candidateEmail) return null;
    
    try {
      setLoading(true);
      console.log('Fetching existing assessment for:', candidateEmail);
      
      const response = await fetch(`http://localhost:5000/api/candidates/assessment/email/${candidateEmail}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Existing assessment found:', result);
        return result.assessment;
      } else if (response.status === 404) {
        console.log('No existing assessment found');
        return null;
      } else {
        console.error('Error fetching assessment:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Network error fetching assessment:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      const initializeForm = async () => {
        console.log('Initializing form with profile:', profile);
        
        // First, try to fetch existing assessment
        const existingAssessment = await fetchExistingAssessment(profile.email);
        
        if (existingAssessment) {
          console.log('Loading existing assessment data');
          setIsExistingAssessment(true);
          setFormData({
            ...initialFormData,
            ...existingAssessment,
            // Ensure basic info is always current from profile
            candidateName: profile.name || existingAssessment.candidateName || '',
            candidateEmail: profile.email || existingAssessment.candidateEmail || '',
            candidatePhone: profile.phone || existingAssessment.candidatePhone || ''
          });
        } else {
          console.log('No existing assessment, pre-populating with profile data');
          setIsExistingAssessment(false);
          setFormData({
            ...initialFormData,
            candidateName: profile.name || '',
            candidateEmail: profile.email || '',
            candidatePhone: profile.phone || ''
          });
        }
        
        // Reset to step 1
        setCurrentStep(1);
      };

      initializeForm();
    }
  }, [isOpen, profile]);

  const steps = [
    {
      id: 1,
      title: "Basic Information",
      icon: User,
      description: "Candidate contact details"
    },
    {
      id: 2,
      title: "Consultancy Assessment",
      icon: Building,
      description: "Professional evaluation"
    },
    {
      id: 3,
      title: "HR Evaluation",
      icon: Users,
      description: "Cultural fit and motivation"
    },
    {
      id: 4,
      title: "Manager Assessment",
      icon: Target,
      description: "Technical and business alignment"
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== Submission Debug ===');
    console.log('Original form data:', formData);

    // Validation: Check if required fields are filled
    if (!formData.candidateName || !formData.candidateName.trim()) {
      console.log('Validation failed: candidateName is empty');
      alert('Please enter candidate name');
      return;
    }

    // Remove empty string fields from the form data
    const filteredData = Object.fromEntries(
      Object.entries(formData).filter(([key, value]) => {
        const shouldInclude = value && value !== "";
        if (!shouldInclude) {
          console.log(`Filtering out empty field: ${key} = "${value}"`);
        }
        return shouldInclude;
      })
    );

    // Add assessment status
    filteredData.assessmentStatus = 'completed';
    
    console.log('Filtered data to send:', filteredData);

    try {
      console.log('Making API request...');
      setLoading(true);
      
      // Always use POST - backend will handle create or update automatically
      const response = await fetch("http://localhost:5000/api/candidates/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filteredData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        console.error("Submission error:", result);
        alert(`Submission failed: ${result.message || 'Unknown error'}`);
      } else {
        console.log("Submission successful!", result);
        alert(result.message || 'Assessment processed successfully!');
        
        // Close modal after successful submission
        onClose();
      }
    } catch (error) {
      console.error("Network error:", error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFormField = (label, field, type = "text", options = null, icon = null, required = false) => {
    const IconComponent = icon;
    
    return (
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent size={16} className="text-gray-500" />}
            {label}
            {required && <span className="text-red-500">*</span>}
          </div>
        </label>
        {type === "select" && options ? (
          <select
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
            required={required}
          >
            <option value="">Select an option</option>
            {options.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            rows="3"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
            placeholder={`Enter ${label.toLowerCase()}`}
            required={required}
          />
        ) : (
          <input
            type={type}
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            placeholder={`Enter ${label.toLowerCase()}`}
            required={required}
          />
        )}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      {isExistingAssessment && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Check size={16} />
            <span className="text-sm font-medium">Existing Assessment Found</span>
          </div>
          <p className="text-blue-600 text-sm mt-1">
            You can view and edit the previously submitted assessment data.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderFormField("Full Name", "candidateName", "text", null, User, true)}
        {renderFormField("Email Address", "candidateEmail", "email", null, Mail)}
        {renderFormField("Phone Number", "candidatePhone", "tel", null, Phone)}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderFormField("Consultancy", "consultancy", "text", null, Building)}
        {renderFormField("Financial Status", "financialStatus", "select", dropdownOptions.financialStatus, DollarSign)}
        {renderFormField("Daily Commute", "dailyCommute", "select", dropdownOptions.dailyCommute, Clock)}
        {renderFormField("Aspirations", "aspirations", "select", dropdownOptions.aspirations, Target)}
        {renderFormField("Money Attitude", "moneyAttitude", "select", dropdownOptions.moneyAttitude, DollarSign)}
        {renderFormField("Loyalty Behavior", "loyaltyBehavior", "select", dropdownOptions.loyaltyBehavior, Heart)}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderFormField("Work Style", "workStyle", "select", dropdownOptions.workStyle, Briefcase)}
        {renderFormField("Pressure Handling", "pressureHandling", "select", dropdownOptions.pressureHandling, Shield)}
        {renderFormField("Role Clarity Need", "roleClarityNeed", "select", dropdownOptions.roleClarityNeed, HelpCircle)}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6">
        {renderFormField("Fear 1 - What concerns you most about this role?", "fear1", "select", dropdownOptions.fear1, Shield)}
        {renderFormField("Motivation 1 - What drives you professionally?", "motivation1", "select", dropdownOptions.motivation1, Zap)}
        {renderFormField("Challenge 1 - Describe a significant challenge you overcame", "challenge1", "select", dropdownOptions.challenge1, Target)}
        {renderFormField("Power Language 1 - How do you communicate authority?", "powerLanguage1", "select", dropdownOptions.powerLanguage1, Users)}
        {renderFormField("Company Priority 1 - What's most important in a company?", "companyPriority1", "select", dropdownOptions.companyPriority1, Building)}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderFormField("Targets - What are your key performance goals?", "targets", "select", dropdownOptions.targets, Target)}
        {renderFormField("References", "references", "text", null, Users)}
        {renderFormField("Software Skills", "softwares", "select", dropdownOptions.softwares, Code)}
        {renderFormField("Product Knowledge", "productKnowledge", "select", dropdownOptions.productKnowledge, Briefcase)}
        {renderFormField("Source of Revenue - How will you contribute to revenue?", "sourceOfRevenue", "select", dropdownOptions.sourceOfRevenue, TrendingUp)}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Candidate Assessment
              </h2>
              <p className="text-gray-600 mt-1">
                {isExistingAssessment ? 'Edit Assessment' : 'Comprehensive Evaluation Process'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex items-center">
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full transition-colors
                        ${isActive 
                          ? 'bg-red-500 text-white' 
                          : isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }
                      `}>
                        {isCompleted ? (
                          <Check size={20} />
                        ) : (
                          <IconComponent size={20} />
                        )}
                      </div>
                      <div className="ml-3 hidden sm:block">
                        <div className={`text-sm font-semibold ${
                          isActive ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {step.description}
                        </div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-px mx-4 ${
                        isCompleted ? 'bg-green-300' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto flex-grow">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                  {currentStep === 3 && renderStep3()}
                  {currentStep === 4 && renderStep4()}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={prevStep}
              disabled={currentStep === 1 || loading}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                ${currentStep === 1 || loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </div>

            {currentStep === steps.length ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Check size={16} />
                )}
                {loading ? 'Processing...' : 'Submit Assessment'}
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={loading}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CandidateDetails;