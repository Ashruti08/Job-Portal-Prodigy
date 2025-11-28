import React, { useState, useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiSearch,
  FiDownload,
  FiEye,
  FiTrash2,
  FiAlertCircle,
  FiX,
  FiRefreshCw,
  FiMail,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiCalendar,
  FiBriefcase,
  FiTrendingUp
} from "react-icons/fi";
import { toast } from "react-toastify";

const SearchResume = () => {
  const { companyToken, backendUrl } = useContext(AppContext);
  const outletContext = useOutletContext();
  const { isLoggedIn, showLoginNotification } = outletContext || {};

  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (companyToken) {
      fetchCombinedData();
    }
  }, [companyToken]);

  useEffect(() => {
    filterAndSortData();
  }, [combinedData, searchQuery, filterStatus, sortBy]);

  const extractCandidateName = (text) => {
    if (!text) return "";
    // Remove file extensions
    let name = text.replace(/\.[^/.]+$/, "");
    // Replace common separators with space
    name = name.replace(/[-_]/g, " ");
    // Remove extra spaces
    name = name.replace(/\s+/g, " ").trim();
    return name;
  };

  const getCsvDataByName = (candidateName, csvData) => {
    if (!csvData || !Array.isArray(csvData.data)) return null;
    
    const normalizedSearchName = candidateName.toLowerCase().trim();
    
    // Search in CSV data (assuming first column is Full Name)
    const matchingRow = csvData.data.find(row => {
      if (!row || !row[0]) return false;
      const csvName = row[0].toLowerCase().trim();
      return csvName === normalizedSearchName;
    });
    
    return matchingRow;
  };

  const parseCsvRow = (row, headers) => {
    if (!row) return {};
    
    const data = {};
    const csvHeaders = [
      'Full Name', 'Mobile Number', 'Specialization', 'Minimum Salary', 
      'Email ID', 'LinkedIn Id', 'Leetcode Id', 'Togoprise',
      'Important', 'Skills', 'Category', 'Product', 'Cleared', 'Current Registration',
      'Current Department', 'Comment', 'Comment'
    ];
    
    row.forEach((value, index) => {
      if (index < csvHeaders.length) {
        data[csvHeaders[index]] = value || "N/A";
      }
    });
    
    return data;
  };

  const fetchCombinedData = async () => {
    setIsLoading(true);
    try {
      // Fetch both resumes and CSV data
      const [resumesRes, csvRes] = await Promise.all([
        axios.get(`${backendUrl}/api/bulk-upload/files?type=resumes&limit=1000`, {
          headers: { token: companyToken }
        }),
        axios.get(`${backendUrl}/api/bulk-upload/files?type=csv&limit=1000`, {
          headers: { token: companyToken }
        })
      ]);

      if (resumesRes.data.success && csvRes.data.success) {
        const resumes = resumesRes.data.data.files || [];
        const csvFiles = csvRes.data.data.files || [];

        // Combine resume data with CSV data
        const combined = resumes.map(resume => {
          // Extract candidate name from resume
          const resumeFileName = resume.originalName || "";
          const extractedName = extractCandidateName(resumeFileName);
          
          // Try to get name from parsed data first
          const candidateName = resume.parsedData?.name || extractedName;
          
          // Search for matching CSV data
          let csvMatch = null;
          let csvMatchedData = null;
          
          for (const csvFile of csvFiles) {
            csvMatchedData = getCsvDataByName(candidateName, csvFile);
            if (csvMatchedData) {
              csvMatch = csvFile;
              break;
            }
          }

          // Parse CSV row if found
          const parsedCsv = csvMatchedData ? parseCsvRow(csvMatchedData, csvMatch?.headers) : null;

          return {
            _id: resume._id,
            resumeName: resumeFileName,
            candidateName: candidateName,
            email: parsedCsv?.['Email ID'] || resume.parsedData?.email || "N/A",
            phone: parsedCsv?.['Mobile Number'] || resume.parsedData?.phone || "N/A",
            location: resume.parsedData?.location || "N/A",
            skills: parsedCsv?.['Skills'] || resume.parsedData?.skills || "N/A",
            experience: resume.parsedData?.experience || "N/A",
            status: resume.status,
            fileSize: resume.fileSize,
            uploadDate: resume.uploadDate || resume.createdAt,
            resumeFile: resume,
            
            // CSV specific fields
            csvData: parsedCsv,
            csvMatched: !!csvMatchedData,
            specialization: parsedCsv?.['Specialization'] || "N/A",
            minimumSalary: parsedCsv?.['Minimum Salary'] || "N/A",
            linkedinId: parsedCsv?.['LinkedIn Id'] || "N/A",
            leetcodeId: parsedCsv?.['Leetcode Id'] || "N/A",
            category: parsedCsv?.['Category'] || "N/A",
            product: parsedCsv?.['Product'] || "N/A",
            cleared: parsedCsv?.['Cleared'] || "N/A",
            currentRegistration: parsedCsv?.['Current Registration'] || "N/A",
            currentDepartment: parsedCsv?.['Current Department'] || "N/A",
            comments: parsedCsv?.['Comment'] || "N/A",
          };
        });

        setCombinedData(combined);
      }
    } catch (error) {
      console.error("Error fetching combined data:", error);
      toast.error("Failed to load resume data");
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortData = () => {
    let filtered = combinedData.filter(item => {
      const matchesSearch = 
        item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.includes(searchQuery) ||
        item.specialization.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        filterStatus === "all" ||
        (filterStatus === "matched" && item.csvMatched) ||
        (filterStatus === "unmatched" && !item.csvMatched);

      return matchesSearch && matchesStatus;
    });

    // Sort data
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.candidateName.localeCompare(b.candidateName);
      } else if (sortBy === "date") {
        return new Date(b.uploadDate) - new Date(a.uploadDate);
      } else if (sortBy === "matched") {
        return (b.csvMatched ? 1 : 0) - (a.csvMatched ? 1 : 0);
      }
      return 0;
    });

    setFilteredData(filtered);
  };

  const downloadResume = async (resume) => {
    try {
      const response = await axios.get(`${backendUrl}/api/bulk-upload/download/${resume._id}`, {
        headers: { token: companyToken },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resume.resumeName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Resume downloaded");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download resume");
    }
  };

  const handleDelete = async (resumeId) => {
    if (window.confirm("Are you sure you want to delete this resume?")) {
      try {
        const response = await axios.delete(
          `${backendUrl}/api/bulk-upload/files/${resumeId}?type=resume`,
          { headers: { token: companyToken } }
        );

        if (response.data.success) {
          toast.success("Resume deleted successfully");
          setCombinedData(combinedData.filter(item => item._id !== resumeId));
        }
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete resume");
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!companyToken) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <FiAlertCircle className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-xl text-gray-600">Please login as a company first</p>
        </div>
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
        {/* Header */}
        <motion.div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#020330' }}>
                Search Resume
              </h1>
              <p className="text-gray-600">
                View combined resume and candidate details from CSV uploads
              </p>
            </div>
            <button
              onClick={() => {
                fetchCombinedData();
              }}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw size={20} />
            </button>
          </div>
        </motion.div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search Box */}
            <div className="relative md:col-span-2">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="matched">Sort by Match Status</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === "all"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All ({combinedData.length})
            </button>
            <button
              onClick={() => setFilterStatus("matched")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === "matched"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Matched ({combinedData.filter(d => d.csvMatched).length})
            </button>
            <button
              onClick={() => setFilterStatus("unmatched")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === "unmatched"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Unmatched ({combinedData.filter(d => !d.csvMatched).length})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <FiRefreshCw className="mx-auto text-4xl text-gray-400 mb-4 animate-spin" />
            <p className="text-gray-600">Loading resumes...</p>
          </div>
        ) : filteredData.length > 0 ? (
          /* Results Table */
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold" style={{ color: '#020330' }}>
                Results ({filteredData.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Candidate</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Phone</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Specialization</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Match Status</th>
                    <th className="py-3 px-6 text-center text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((candidate, index) => (
                    <motion.tr
                      key={candidate._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: '#ff6666' }}
                          >
                            {candidate.candidateName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {candidate.candidateName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {candidate.resumeName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FiMail size={14} className="text-gray-400" />
                          {candidate.email}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FiPhone size={14} className="text-gray-400" />
                          {candidate.phone}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {candidate.specialization}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            candidate.csvMatched
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {candidate.csvMatched ? "✓ Matched" : "⚠ Unmatched"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={() => downloadResume(candidate.resumeFile)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <FiDownload size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(candidate._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <FiFileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">No resumes found</p>
            <p className="text-sm text-gray-500">
              Upload resumes and CSV files to see combined data here
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: '#ff6666' }}
                  >
                    {selectedCandidate.candidateName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: '#020330' }}>
                      {selectedCandidate.candidateName}
                    </h3>
                    <p className="text-sm text-gray-600">{selectedCandidate.resumeName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-auto p-6">
                {/* Contact Information */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4" style={{ color: '#020330' }}>
                    📋 Contact Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 block mb-1">Email</label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <FiMail size={16} className="text-red-500" />
                        <a href={`mailto:${selectedCandidate.email}`} className="hover:text-red-500 break-all">
                          {selectedCandidate.email}
                        </a>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 block mb-1">Phone</label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <FiPhone size={16} className="text-red-500" />
                        <a href={`tel:${selectedCandidate.phone}`} className="hover:text-red-500">
                          {selectedCandidate.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4" style={{ color: '#020330' }}>
                    💼 Professional Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="text-sm text-gray-600 block mb-1">Specialization</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.specialization}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="text-sm text-gray-600 block mb-1">Category</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.category}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="text-sm text-gray-600 block mb-1">Product</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.product}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="text-sm text-gray-600 block mb-1">Current Department</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.currentDepartment}</p>
                    </div>
                  </div>
                </div>

                {/* Salary & Status */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4" style={{ color: '#020330' }}>
                    💰 Salary & Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <label className="text-sm text-gray-600 block mb-1">Minimum Salary</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.minimumSalary}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <label className="text-sm text-gray-600 block mb-1">Cleared</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.cleared}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <label className="text-sm text-gray-600 block mb-1">Current Registration</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.currentRegistration}</p>
                    </div>
                  </div>
                </div>

                {/* Social & Technical Links */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4" style={{ color: '#020330' }}>
                    🔗 Links & IDs
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                      <label className="text-sm text-gray-600 block mb-1">LinkedIn ID</label>
                      <a 
                        href={selectedCandidate.linkedinId !== "N/A" ? `https://linkedin.com/in/${selectedCandidate.linkedinId}` : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 break-all"
                      >
                        {selectedCandidate.linkedinId}
                      </a>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                      <label className="text-sm text-gray-600 block mb-1">LeetCode ID</label>
                      <a 
                        href={selectedCandidate.leetcodeId !== "N/A" ? `https://leetcode.com/${selectedCandidate.leetcodeId}` : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 break-all"
                      >
                        {selectedCandidate.leetcodeId}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4" style={{ color: '#020330' }}>
                    🎯 Skills
                  </h4>
                  <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                    <p className="text-gray-900">{selectedCandidate.skills}</p>
                  </div>
                </div>

                {/* Comments */}
                {selectedCandidate.comments && selectedCandidate.comments !== "N/A" && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-4" style={{ color: '#020330' }}>
                      📝 Comments
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
                      <p className="text-gray-900">{selectedCandidate.comments}</p>
                    </div>
                  </div>
                )}

                {/* Resume Info */}
                <div className="mb-6 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold mb-4" style={{ color: '#020330' }}>
                    📄 Resume Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 block mb-1">File Size</label>
                      <p className="text-gray-900 font-medium">
                        {formatFileSize(selectedCandidate.fileSize)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 block mb-1">Status</label>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          selectedCandidate.status === 'processed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {selectedCandidate.status.charAt(0).toUpperCase() +
                          selectedCandidate.status.slice(1)}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 block mb-1">Upload Date</label>
                      <p className="text-gray-900 font-medium">
                        {new Date(selectedCandidate.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CSV Match Status */}
                {selectedCandidate.csvMatched ? (
                  <div className="mb-6 bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                    <h4 className="text-lg font-semibold mb-2" style={{ color: '#020330' }}>
                      ✅ CSV Data Matched Successfully
                    </h4>
                    <p className="text-sm text-gray-600">
                      This candidate's resume has been matched with CSV data. All details above are automatically populated from the CSV file.
                    </p>
                  </div>
                ) : (
                  <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                    <h4 className="text-lg font-semibold mb-2" style={{ color: '#020330' }}>
                      ⚠️ No CSV Match Found
                    </h4>
                    <p className="text-sm text-gray-600">
                      This resume could not be matched with any CSV data. Make sure the candidate name in the resume and CSV file are identical.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => downloadResume(selectedCandidate.resumeFile)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiDownload />
                  <span>Download Resume</span>
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SearchResume;