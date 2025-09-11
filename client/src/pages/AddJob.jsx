import Quill from "quill";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Jobdesignation, JobLocations } from "../assets/assets";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

// Job Channel Options
const JobChannels = [
  "Agency Channel",
  "Bancassurance", 
  "Direct Sales",
  "Digital/Online Sales",
  "Broker Channel",
  "Corporate / Group Channel",
  "POSP (Point of Sales Person)",
  "Worksite Marketing",
  "Alternate Channels",
  "Franchisee/Entrepreneurial",
  "Sub Borker",
  "IAF",
  "DSA"
];

// Job Category Options
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

const AddJob = () => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Bangalore");
  const [designation, setCategory] = useState("Branch Manager");
  const [level, setLevel] = useState("Junior Level");
  const [jobchannel, setJobChannel] = useState("Agency Channel");
  const [jobcategory, setJobCategory] = useState("Equity Broking");
  const [noticeperiod, setNoticeperiod] = useState("Immediate");
  const [salary, setSalary] = useState(""); // Changed from 0 to empty string
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [isFormValid, setIsFormValid] = useState(false);

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const { backendUrl, companyToken } = useContext(AppContext);

  // Updated validation to handle string salary
  useEffect(() => {
    const salaryNum = Number(salary);
    if (title.trim() && salaryNum > 0 && !isNaN(salaryNum)) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [title, salary]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Get description from Quill editor
      const description = quillRef.current ? quillRef.current.root.innerHTML : '';
      
      // Convert salary to number
      const salaryNum = Number(salary);
      
      // Basic validation
      if (!title.trim()) {
        toast.error("Job title is required");
        setFormStep(1);
        return;
      }
      
      if (salaryNum <= 0 || isNaN(salaryNum)) {
        toast.error("Please enter a valid salary");
        setFormStep(1);
        return;
      }
      
      // Check if description has actual content
      const textContent = quillRef.current ? quillRef.current.getText().trim() : '';
      if (!textContent || textContent.length === 0) {
        toast.error("Job description is required");
        setFormStep(2);
        return;
      }
      
      console.log("Posting job with data:", {
        title: title.trim(),
        description,
        location,
        designation,
        level,
        jobchannel,
        jobcategory,
        noticeperiod,
        salary: salaryNum,
        salaryType: typeof salaryNum
      });

      const { data } = await axios.post(
        backendUrl + "/api/company/post-job",
        { 
          title: title.trim(),
          description: description,
          location,
          designation,
          level,
          jobchannel,
          jobcategory,
          noticeperiod,
          salary: salaryNum // Make sure this is a number
        },
        { 
          headers: { 
            token: companyToken,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log("Server response:", data);

      if (data.success) {
        toast.success("Job posted successfully!");
        
        // Reset form
        setTitle("");
        setSalary(""); // Reset to empty string
        setLocation("Bangalore");
        setCategory("Branch Manager");
        setLevel("Junior Level");
        setJobChannel("Agency Channel");
        setJobCategory("Equity Broking");
        setNoticeperiod("Immediate");
        
        // Clear Quill editor
        if (quillRef.current) {
          quillRef.current.root.innerHTML = "";
        }
        
        setFormStep(1);
        
      } else {
        toast.error(data.message || "Failed to post job");
      }
      
    } catch (error) {
      console.error("Job posting error:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to post job");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to move to preview with description validation
  const moveToPreview = () => {
    if (!quillRef.current) {
      toast.error("Editor not ready, please try again");
      return;
    }
    
    const textContent = quillRef.current.getText().trim();
    if (!textContent || textContent.length === 0) {
      toast.error("Please add a job description before previewing");
      return;
    }
    
    setFormStep(3);
  };

  useEffect(() => {
    // Initialize Quill only once
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['clean'],
            ['link', 'image']
          ]
        },
        placeholder: 'Create a detailed job description...'
      });
    }
  }, []);

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 mt-8">
        <h2 className="text-2xl md:text-3xl font-bold text-primary">Post a New Position</h2>
        <p className="text-gray-500 mt-1">Create a job listing to attract the perfect candidates</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Basic Info</span>
          <span className="text-sm font-medium text-gray-700">Job Details</span>
          <span className="text-sm font-medium text-gray-700">Preview & Post</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-in-out"
            style={{ width: `${(formStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={onSubmitHandler} className="relative">
        {/* Step 1: Basic Info */}
        <motion.div 
          className={`${formStep === 1 ? 'block' : 'hidden'}`}
          initial="hidden"
          animate="visible"
          variants={formVariants}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mr-3">1</div>
              <h3 className="text-xl font-semibold text-gray-800">Job Basics</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Senior Sales Manager"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
                  />
                  {title && (
                    <span className="absolute right-3 top-3 text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary (Annual) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 75000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)} // Don't convert here
                    required
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200"
                  />
                  {salary && Number(salary) > 0 && (
                    <span className="absolute right-3 top-3 text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">Enter the annual salary in USD</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setFormStep(2)}
              disabled={!title || Number(salary) <= 0 || isNaN(Number(salary))}
              className={`px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 ${
                (!title || Number(salary) <= 0 || isNaN(Number(salary))) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Continue to Job Details
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Step 2: Job Details */}
        <motion.div 
          className={`${formStep === 2 ? 'block' : 'hidden'}`}
          initial="hidden"
          animate="visible"
          variants={formVariants}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mr-3">2</div>
              <h3 className="text-xl font-semibold text-gray-800">Job Details</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <div 
                  ref={editorRef}
                  className="w-full border border-gray-300 rounded-lg min-h-48"
                ></div>
                <p className="mt-1 text-xs text-gray-500">
                  Be specific about responsibilities, requirements, benefits, and company culture
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all duration-200"
                  >
                    {Jobdesignation.map((cat, index) => (
                      <option key={index} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all duration-200"
                  >
                    {JobLocations.map((loc, index) => (
                      <option key={index} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all duration-200"
                  >
                    <option value="Beginner level">Beginner level</option>
                    <option value="Intermediate level">Intermediate level</option>
                    <option value="Senior level">Senior level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Channel
                  </label>
                  <select
                    value={jobchannel}
                    onChange={(e) => setJobChannel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all duration-200"
                  >
                    {JobChannels.map((channel, index) => (
                      <option key={index} value={channel}>
                        {channel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Category
                  </label>
                  <select
                    value={jobcategory}
                    onChange={(e) => setJobCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all duration-200"
                  >
                    {JobCategories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notice Period
                  </label>
                  <select
                    value={noticeperiod}
                    onChange={(e) => setNoticeperiod(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white transition-all duration-200"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="Within a week">Within a week</option>
                    <option value="Within a month">Within a month</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setFormStep(1)}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Back
            </button>
            <button
              type="button"
              onClick={moveToPreview}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
            >
              Preview Job
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Step 3: Preview & Submit */}
        <motion.div 
          className={`${formStep === 3 ? 'block' : 'hidden'}`}
          initial="hidden"
          animate="visible"
          variants={formVariants}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mr-3">3</div>
              <h3 className="text-xl font-semibold text-gray-800">Preview & Post</h3>
            </div>
            
            <div className="space-y-6">
              <div className="p-6 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{title || "Job Title"}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {location}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {designation}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {level}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                        {jobchannel}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-fuchsia-100 text-fuchsia-800">
                        {jobcategory}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {noticeperiod}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">
                      ${salary ? Number(salary).toLocaleString() : '0'}
                    </span>
                    <p className="text-sm text-gray-500">per year</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Job Description</h4>
                  <div className="prose max-w-none">
                    {quillRef.current && (
                      <div dangerouslySetInnerHTML={{ __html: quillRef.current.root.innerHTML }} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setFormStep(2)}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Edit Details
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting...
                </>
              ) : (
                <>
                  Post Job
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
};

export default AddJob;