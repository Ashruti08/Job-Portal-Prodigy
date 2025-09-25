import React, { useContext, useEffect, useState, useRef } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import Loading from "../components/Loading";
import CandidateDetails from "./CandidateDetails"; // Import the new component
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, FileText, ChevronDown, User, MapPin, Briefcase, MoreHorizontal, Search, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.png";

const ViewApplications = () => {
  const { backendUrl, companyToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const dropdownRef = useRef(null);

  if (!companyToken) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-white rounded-xl shadow-md">
        <div className="text-center">
          <p className="text-xl sm:text-2xl text-gray-600 mb-4">Please login as a company first</p>
       
        </div>
      </div>
    );
  }

  const fetchCompanyJobApplications = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/company/applicants`, {
        headers: { token: companyToken },
      });

      if (data.success) {
        console.log("Fetched applications:", data.applications);
        setApplicants(data.applications.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const changeJobApplicationStatus = async (id, status) => {
    try {
      console.log("Changing status for application:", id, "to:", status);
      
      const { data } = await axios.post(
        `${backendUrl}/api/company/change-status`,
        { id, status },
        { headers: { token: companyToken } }
      );

      if (data.success) {
        setApplicants(prevApplicants => 
          prevApplicants.map(applicant => 
            applicant._id === id ? { ...applicant, status } : applicant
          )
        );
        toast.success(`Application ${status.toLowerCase()} successfully`);
        setActiveDropdown(null); // Close dropdown after status change
      } else {
        console.error("Status change failed:", data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error changing status:", error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleViewResume = (resumeUrl, applicantName) => {
    if (!resumeUrl) {
      toast.error("Resume not available for this applicant");
      return;
    }

    let fullUrl = resumeUrl;
    if (!resumeUrl.startsWith('http')) {
      const cleanUrl = resumeUrl.startsWith('/') ? resumeUrl.substring(1) : resumeUrl;
      fullUrl = `${backendUrl}/${cleanUrl}`;
    }

    console.log("Opening resume URL:", fullUrl);

    try {
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening resume:', error);
      toast.error("Could not open resume. Please try again.");
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return defaultAvatar;
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('/')) {
      return `${backendUrl}${imagePath}`;
    } else {
      return `${backendUrl}/${imagePath}`;
    }
  };

  const handleViewProfile = (userId, userData) => {
    console.log("Viewing profile for user:", userId, userData);
    
    if (!userId) {
      toast.error("User profile not available");
      return;
    }
    
    setSelectedProfile(userData);
    setProfileModalOpen(true);
  };

  // Fixed click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (companyToken) {
      fetchCompanyJobApplications();
    }
  }, [companyToken]);

  const filteredApplicants = applicants
    .filter(item => item.jobId && item.userId)
    .filter(applicant => {
      const matchesSearch = searchTerm === "" || 
        (applicant.userId?.name && applicant.userId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (applicant.jobId?.title && applicant.jobId.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (applicant.jobId?.location && applicant.jobId.location.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "pending" && (!applicant.status || applicant.status.toLowerCase() === "pending")) ||
        (filterStatus === "accepted" && applicant.status && applicant.status.toLowerCase() === "accepted") ||
        (filterStatus === "rejected" && applicant.status && applicant.status.toLowerCase() === "rejected");
      
      return matchesSearch && matchesStatus;
    });

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase() || "pending";
    
    switch(normalizedStatus) {
      case "accepted":
        return (
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-full text-sm font-medium">
            <Check size={14} />
            <span>Accepted</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-2 rounded-full text-sm font-medium">
            <X size={14} />
            <span>Rejected</span>
          </div>
        );
      default:
        return (
          <div 
            className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: '#FFF0F0', color: '#FF0000' }}
          >
            <ChevronDown size={14} />
            <span>Pending</span>
          </div>
        );
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: '#020330' }}
          >
            Application Management
          </h1>
          <p className="text-gray-500">Review and manage candidate applications</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6"
        >
          {/* Filters and Search */}
          <div className="p-5 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[250px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search applicants..."
                className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-200 focus:ring-2 focus:border-red-300 transition-colors"
                style={{ '--tw-ring-color': 'rgba(255, 0, 0, 0.1)' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <style jsx>{`
                input:focus {
                  box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.1) !important;
                }
              `}</style>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "all" 
                    ? "text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                style={filterStatus === "all" ? { backgroundColor: '#FF0000' } : {}}
              >
                All ({applicants.length})
              </button>
              <button 
                onClick={() => setFilterStatus("pending")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "pending" 
                    ? "text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                style={filterStatus === "pending" ? { backgroundColor: '#FF0000' } : {}}
              >
                Pending ({applicants.filter(a => !a.status || a.status.toLowerCase() === "pending").length})
              </button>
              <button 
                onClick={() => setFilterStatus("accepted")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "accepted" 
                    ? "bg-emerald-100 text-emerald-600" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Accepted ({applicants.filter(a => a.status && a.status.toLowerCase() === "accepted").length})
              </button>
              <button 
                onClick={() => setFilterStatus("rejected")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === "rejected" 
                    ? "bg-red-100 text-red-600" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Rejected ({applicants.filter(a => a.status && a.status.toLowerCase() === "rejected").length})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full">
              <thead className="bg-gray-50" style={{ color: '#020330' }}>
                <tr>
                  <th className="py-4 px-5 text-left text-sm font-semibold">#</th>
                  <th className="py-4 px-5 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>Applicant</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 text-left text-sm font-semibold max-md:hidden">
                    <div className="flex items-center gap-2">
                      <Briefcase size={16} />
                      <span>Job Position</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 text-left text-sm font-semibold max-md:hidden">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>Location</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 text-left text-sm font-semibold">Actions</th>
                  <th className="py-4 px-5 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              
              <tbody>
                {filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="flex flex-col items-center justify-center py-16">
                        <img 
                          src={assets.default_company_icon || "/empty-state.svg"} 
                          alt="No applications" 
                          className="w-20 h-20 mb-4 opacity-30"
                        />
                        <h3 
                          className="text-lg font-medium mb-1"
                          style={{ color: '#020330' }}
                        >
                          No applications found
                        </h3>
                        <p className="text-gray-500 text-center mb-2">No matching applications with the current filters</p>
                        {(searchTerm || filterStatus !== "all") && (
                          <button 
                            onClick={() => {
                              setSearchTerm("");
                              setFilterStatus("all");
                            }}
                            className="mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:opacity-90"
                            style={{ backgroundColor: '#FF0000' }}
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((applicant, index) => (
                    <motion.tr 
                      key={applicant._id || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-red-50/30 transition-colors"
                    >
                      <td className="py-4 px-5 text-sm text-gray-600">{index + 1}</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 cursor-pointer hover:border-red-300 transition-colors"
                            onClick={() => handleViewProfile(applicant.userId?._id, applicant.userId)}
                            title="View profile"
                          >
                            <img
                              className="w-full h-full object-cover"
                              src={getImageUrl(applicant.userId?.image)}
                              alt={`${applicant.userId?.name || 'Applicant'}'s avatar`}
                              onError={(e) => {
                                console.log("Image load error for:", applicant.userId?.image);
                                e.target.onerror = null;
                                e.target.src = defaultAvatar;
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {applicant.userId?.name || 'Unknown'}
                            </div>
                            <div className="text-gray-500 text-sm">
                              {applicant.userId?.email || 'No email'}
                            </div>
                            <div className="text-gray-500 text-sm md:hidden">
                              {applicant.jobId?.title || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-gray-700 max-md:hidden">
                        {applicant.jobId?.title || 'N/A'}
                      </td>
                      <td className="py-4 px-5 text-gray-700 max-md:hidden">
                        {applicant.jobId?.location || 'Remote'}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewResume(applicant.userId?.resume, applicant.userId?.name)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:opacity-90"
                            style={{ backgroundColor: '#FF0000' }}
                            disabled={!applicant.userId?.resume}
                          >
                            <FileText size={14} />
                            Resume
                          </button>
                          <button
                            onClick={() => handleViewProfile(applicant.userId?._id, applicant.userId)}
                            className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                          >
                            <Eye size={14} />
                            Profile
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-5 relative">
                        {(!applicant.status || applicant.status.toLowerCase() === "pending") ? (
                          <div className="relative" ref={dropdownRef}>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("Clicking pending button for index:", index);
                                setActiveDropdown(activeDropdown === index ? null : index);
                              }}
                              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 text-white hover:opacity-90"
                              style={{ backgroundColor: '#FF0000' }}
                            >
                              <span>Pending</span>
                              <MoreHorizontal size={16} />
                            </button>
                            
                            <AnimatePresence>
                              {activeDropdown === index && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute right-0 bottom-full mb-1 z-50 w-36 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
                                  style={{ 
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                                  }}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log("Accepting application:", applicant._id);
                                      changeJobApplicationStatus(applicant._id, "Accepted");
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm font-medium text-green-600 hover:bg-green-50 flex items-center gap-2 transition-colors border-b border-gray-100"
                                  >
                                    <Check size={16} />
                                    Accept
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log("Rejecting application:", applicant._id);
                                      changeJobApplicationStatus(applicant._id, "Rejected");
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                  >
                                    <X size={16} />
                                    Reject
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          getStatusBadge(applicant.status)
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        

        {/* Replace the old ProfileModal with the new CandidateDetails */}
        <CandidateDetails 
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          profile={selectedProfile}
        />
      </div>
    </div>
  );
};

export default ViewApplications;