import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import { motion } from "framer-motion";

const ManageJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { backendUrl, companyToken, setShowRecruiterLogin } = useContext(AppContext);
  
  // Get context from Dashboard component
  const outletContext = useOutletContext();
  const { isLoggedIn, showLoginNotification, setShowRecruiterLogin: setShowRecruiterLoginFromContext } = outletContext || {};

  // Debug logging for token
  useEffect(() => {
    console.log("=== ManageJobs Debug ===");
    console.log("companyToken from context:", companyToken);
    console.log("companyToken type:", typeof companyToken);
    console.log("localStorage companyToken:", localStorage.getItem('companyToken'));
    console.log("backendUrl:", backendUrl);
    console.log("isLoggedIn:", isLoggedIn);
    console.log("setShowRecruiterLogin available:", !!setShowRecruiterLogin);
    console.log("setShowRecruiterLoginFromContext available:", !!setShowRecruiterLoginFromContext);
    console.log("========================");
  }, [companyToken, backendUrl, isLoggedIn, setShowRecruiterLogin, setShowRecruiterLoginFromContext]);

  // Function to fetch company Job Applications
  const fetchCompanyJobs = async () => {
    console.log("=== fetchCompanyJobs Start ===");
    console.log("companyToken before request:", companyToken);
    
    setIsLoading(true);
    try {
      if (!companyToken) {
        console.log("No companyToken available, skipping request");
        setIsLoading(false);
        return;
      }

      console.log("Making request with headers:", { token: companyToken });
      
      const { data } = await axios.get(backendUrl + "/api/company/list-jobs", {
        headers: { token: companyToken },
      });

      console.log("API Response:", data);

      if (data.success && Array.isArray(data.jobsData)) {
        setJobs(data.jobsData.reverse());
        console.log("Jobs set successfully:", data.jobsData.length);
      } else {
        setJobs([]);
        toast.error(data.message || "Failed to fetch jobs");
      }
    } catch (error) {
      console.error("Error in fetchCompanyJobs:", error);
      console.error("Error response:", error.response?.data);
      setJobs([]);
      
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error(error.message || "Failed to fetch jobs");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to change Job Visibility
  const changeJobVisiblity = async (id) => {
    try {
      if (!companyToken) {
        toast.error("Please login as a company first");
        return;
      }

      const { data } = await axios.post(
        backendUrl + "/api/company/change-visibility",
        { id },
        {
          headers: { token: companyToken },
        }
      );
      if (data.success) {
        toast.success(data.message);
        fetchCompanyJobs();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error changing visibility:", error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    console.log("useEffect triggered, companyToken:", companyToken);
    if (companyToken) {
      fetchCompanyJobs();
    } else {
      console.log("No companyToken, not fetching jobs");
      setIsLoading(false);
    }
  }, [companyToken]);

  // Updated to use setShowRecruiterLogin instead of navigate
  const handleLoginClick = () => {
    console.log("handleLoginClick called");
    console.log("setShowRecruiterLogin available:", !!setShowRecruiterLogin);
    console.log("setShowRecruiterLoginFromContext available:", !!setShowRecruiterLoginFromContext);
    console.log("outletContext:", outletContext);
    
    // Try context function first, then fallback to direct context access
    if (setShowRecruiterLoginFromContext) {
      console.log("Opening recruiter login modal via context");
      setShowRecruiterLoginFromContext(true);
    } else if (setShowRecruiterLogin) {
      console.log("Opening recruiter login modal via direct context");
      setShowRecruiterLogin(true);
    } else {
      console.log("No setShowRecruiterLogin function available, using fallback");
      toast.info("Please use the recruiter login option in the navigation");
      navigate('/');
    }
  };

  // Show login message if no token
  if (!companyToken) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-white rounded-xl shadow-md">
        <div className="text-center">
          <p className="text-xl sm:text-2xl text-gray-600 mb-4">Please login as a company first</p>
       
        </div>
      </div>
    );
  }

  if (isLoading) return <Loading />;

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-white rounded-xl shadow-md">
        <p className="text-xl sm:text-2xl text-gray-600">No Jobs Available or posted</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="container p-4 mx-auto">
        {/* Dashboard Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="mb-6">
            <h1 
              className="text-2xl md:text-3xl font-bold mb-2"
              style={{ color: '#020330' }}
            >
              Manage Jobs
            </h1>
            <p className="text-gray-600">View, update, and manage your job listings</p>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div 
              className="bg-white rounded-xl shadow-md p-5 border-l-4"
              style={{ borderLeftColor: '#FF0000' }}
            >
              <p className="text-gray-500 text-sm mb-1">Total Jobs</p>
              <p 
                className="text-2xl font-bold"
                style={{ color: '#FF0000' }}
              >
                {jobs.length}
              </p>
            </div>
            <div 
              className="bg-white rounded-xl shadow-md p-5 border-l-4"
              style={{ borderLeftColor: '#FF0000' }}
            >
              <p className="text-gray-500 text-sm mb-1">Active Jobs</p>
              <p 
                className="text-2xl font-bold"
                style={{ color: '#FF0000' }}
              >
                {jobs.filter((job) => job.visible).length}
              </p>
            </div>
            <div 
              className="bg-white rounded-xl shadow-md p-5 border-l-4"
              style={{ borderLeftColor: '#FF0000' }}
            >
              <p className="text-gray-500 text-sm mb-1">Total Applicants</p>
              <p 
                className="text-2xl font-bold"
                style={{ color: '#FF0000' }}
              >
                {jobs.reduce((sum, job) => sum + (job.applicants || 0), 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="overflow-x-auto w-full">
            <table className="w-full" style={{ color: '#020330' }}>
              <thead 
                className="border-b"
                style={{ backgroundColor: '#F8F9FA' }}
              >
                <tr>
                  <th 
                    className="py-4 px-6 text-left max-sm:hidden sm:text-[16px] font-semibold"
                    style={{ color: '#020330' }}
                  >
                    #
                  </th>
                  <th 
                    className="py-4 px-6 text-left sm:text-[16px] font-semibold"
                    style={{ color: '#020330' }}
                  >
                    Job Title
                  </th>
                  <th 
                    className="py-4 px-6 text-left max-sm:hidden sm:text-[16px] font-semibold"
                    style={{ color: '#020330' }}
                  >
                    Date
                  </th>
                  <th 
                    className="py-4 px-6 text-left max-sm:hidden sm:text-[16px] font-semibold"
                    style={{ color: '#020330' }}
                  >
                    Location
                  </th>
                  <th 
                    className="py-4 px-6 text-center sm:text-[16px] font-semibold"
                    style={{ color: '#020330' }}
                  >
                    <span className="flex items-center justify-center">Applicants</span>
                  </th>
                  <th 
                    className="py-4 px-6 text-center sm:text-[16px] font-semibold"
                    style={{ color: '#020330' }}
                  >
                    Visible
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, index) => (
                  <tr
                    key={job._id || index}
                    className="sm:text-[15px] border-b hover:bg-gray-50 transition-colors"
                    style={{ color: '#020330' }}
                  >
                    <td className="py-4 px-6 max-sm:hidden">{index + 1}</td>
                    <td 
                      className="py-4 px-6 font-medium"
                      style={{ color: '#020330' }}
                    >
                      {job.title}
                    </td>
                    <td className="py-4 px-6 max-sm:hidden text-gray-600">
                      {job.date ? moment(job.date).format("ll") : "N/A"}
                    </td>
                    <td className="py-4 px-6 max-sm:hidden text-gray-600">
                      {job.location || "N/A"}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            job.applicants > 0
                              ? "text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                          style={job.applicants > 0 ? { backgroundColor: '#FF0000' } : {}}
                        >
                          {job.applicants || 0}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            onChange={() => changeJobVisiblity(job._id)}
                            className="sr-only peer"
                            type="checkbox"
                            checked={job.visible}
                          />
                          <div 
                            className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                            style={{ 
                              '--tw-ring-color': '#FF0000',
                              '--peer-checked-bg': '#FF0000'
                            }}
                          >
                            <style jsx>{`
                              .peer:checked ~ div {
                                background-color: #FF0000 !important;
                              }
                              .peer:focus ~ div {
                                box-shadow: 0 0 0 4px rgba(255, 0, 0, 0.2) !important;
                              }
                            `}</style>
                          </div>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => navigate("/dashboard/add-job")}
            className="text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition duration-300 ease-in-out flex items-center gap-2 shadow-md"
            style={{ backgroundColor: '#FF0000' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add new Job
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ManageJobs;