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
  FiTrendingUp,
  FiCheckCircle
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
  const [matchingStats, setMatchingStats] = useState({
    total: 0,
    matched: 0,
    unmatched: 0,
    matchRate: 0
  });

  useEffect(() => {
    if (companyToken) {
      fetchCombinedData();
    }
  }, [companyToken]);

  useEffect(() => {
    filterAndSortData();
  }, [combinedData, searchQuery, filterStatus, sortBy]);

  // Enhanced name extraction from resume filename
  const extractCandidateName = (text) => {
    if (!text) return "";
    
    // Remove file extension
    let name = text.replace(/\.(pdf|doc|docx)$/i, "");
    
    // Replace common separators with space
    name = name.replace(/[-_]/g, " ");
    
    // Remove extra spaces and numbers
    name = name.replace(/\s+/g, " ")
                .replace(/\d+/g, "")
                .trim();
    
    // Capitalize each word
    name = name.split(' ')
               .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
               .join(' ');
    
    return name;
  };

  // Normalize name for comparison (remove spaces, special chars, convert to lowercase)
  const normalizeName = (name) => {
    if (!name) return "";
    return name.toLowerCase()
               .replace(/\s+/g, "")  // Remove all spaces
               .replace(/[^a-z]/g, "");  // Remove all non-alphabetic characters
  };

  // Check if two names match
  const namesMatch = (name1, name2) => {
    const normalized1 = normalizeName(name1);
    const normalized2 = normalizeName(name2);
    
    // Exact match
    if (normalized1 === normalized2) return true;
    
    // Partial match (one name contains the other and length difference < 3)
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      const lengthDiff = Math.abs(normalized1.length - normalized2.length);
      if (lengthDiff <= 3) return true;
    }
    
    return false;
  };

  // Get CSV data by matching candidate name
  const getCsvDataByName = (candidateName, csvFile) => {
    if (!csvFile || !csvFile.data || !Array.isArray(csvFile.data)) return null;
    
    console.log('=== CSV DATA STRUCTURE ===');
    console.log('CSV File:', csvFile.originalName);
    console.log('First 3 rows:', csvFile.data.slice(0, 3));
    console.log('Looking for candidate:', candidateName);
    
    // Search in CSV data - combining First Name, Middle Name, and Surname
    const matchingRow = csvFile.data.find((row, index) => {
      if (!row || row.length < 3) return false;
      
      // Skip header row
      if (index === 0 && row[0]?.toLowerCase().includes('first')) {
        return false;
      }
      
      // Construct full name from CSV (First Name + Middle Name + Surname)
      const firstName = row[0] || '';
      const middleName = row[1] || '';
      const surname = row[2] || '';
      const csvFullName = `${firstName} ${middleName} ${surname}`.trim().replace(/\s+/g, ' ');
      
      // Also try without middle name
      const csvFullNameNoMiddle = `${firstName} ${surname}`.trim().replace(/\s+/g, ' ');
      
      console.log(`Row ${index}: CSV Name = "${csvFullName}" (or "${csvFullNameNoMiddle}") vs Resume Name = "${candidateName}"`);
      
      const isMatch = namesMatch(candidateName, csvFullName) || namesMatch(candidateName, csvFullNameNoMiddle);
      if (isMatch) {
        console.log('✓ MATCH FOUND!');
      }
      
      return isMatch;
    });
    
    if (matchingRow) {
      console.log('Matched row data:', matchingRow);
    } else {
      console.log('❌ No match found for:', candidateName);
    }
    
    return matchingRow;
  };

  // Parse CSV row into structured data based on your actual headers
  const parseCsvRow = (row) => {
    if (!row) return {};
    
    const data = {};
    // Your actual CSV headers
    const csvHeaders = [
      'First Name', 'Middle Name', 'Surname', 'Mobile No', 
      'Email ID', 'Linkedin ID', 'Facebook ID', 'Instagram ID', 'Snapchat',
      'City', 'State', 'Languages', 'Marital Status',
      'Sector', 'Category', 'Product', 'Channel', 
      'Current Designation', 'Current Department', 'Current CTC', 'Expected CTC',
      'Notice Period', 'Total Experience', 'Broker Roll / Company Roll', 'Status for Job Change'
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
        const resumes = resumesRes.data.data?.files || resumesRes.data.files || [];
        const csvFiles = csvRes.data.data?.files || csvRes.data.files || [];

        console.log('=== API RESPONSE ===');
        console.log('Resumes response:', resumesRes.data);
        console.log('CSV response:', csvRes.data);
        console.log('Resumes found:', resumes.length);
        console.log('CSV files found:', csvFiles.length);
        
        // If CSV files don't have parsed data, fetch and parse them
        const parsedCsvFiles = await Promise.all(
          csvFiles.map(async (csvFile) => {
            // Check if data is already available
            if (csvFile.data && Array.isArray(csvFile.data) && csvFile.data.length > 0) {
              console.log('CSV already has data:', csvFile.originalName);
              return csvFile;
            }
            
            // Otherwise, fetch and parse the CSV
            console.log('Fetching CSV content for:', csvFile.originalName);
            try {
              const response = await axios.get(`${backendUrl}/api/bulk-upload/download/${csvFile._id}`, {
                headers: { token: companyToken },
                responseType: 'blob'
              });
              
              const text = await response.data.text();
              
              // Detect delimiter (tab or comma)
              const firstLine = text.split('\n')[0];
              const delimiter = firstLine.includes('\t') ? '\t' : ',';
              
              console.log('Detected delimiter:', delimiter === '\t' ? 'TAB' : 'COMMA');
              
              const rows = text.split('\n').map(row => {
                // Split by detected delimiter
                if (delimiter === '\t') {
                  return row.split('\t').map(cell => cell.trim());
                } else {
                  // Handle CSV with proper parsing (handles commas in quotes)
                  const regex = /(".*?"|[^,]+)(?=\s*,|\s*$)/g;
                  return row.match(regex)?.map(cell => cell.replace(/^"|"$/g, '').trim()) || [];
                }
              }).filter(row => row.length > 1 && row.some(cell => cell !== ''));
              
              console.log('Total rows:', rows.length);
              console.log('Headers:', rows[0]);
              console.log('First data row:', rows[1]);
              
              return {
                ...csvFile,
                data: rows
              };
            } catch (error) {
              console.error('Error fetching/parsing CSV:', csvFile.originalName, error);
              return csvFile;
            }
          })
        );
        
        console.log('=== PARSED CSV FILES ===');
        parsedCsvFiles.forEach((csvFile, idx) => {
          console.log(`CSV ${idx + 1}: ${csvFile.originalName}`);
          console.log('Has data:', !!csvFile.data);
          console.log('Rows:', csvFile.data?.length || 0);
        });

        // Combine resume data with CSV data
        const combined = resumes.map(resume => {
          // Extract candidate name from resume
          const resumeFileName = resume.originalName || "";
          const extractedName = extractCandidateName(resumeFileName);
          
          console.log('Processing resume:', resumeFileName, '-> Extracted name:', extractedName);
          
          // Try to get name from parsed data first, fallback to extracted name
          const candidateName = resume.parsedData?.name || extractedName;
          
          // Search for matching CSV data across all CSV files
          let csvMatch = null;
          let csvMatchedData = null;
          
          for (const csvFile of parsedCsvFiles) {
            csvMatchedData = getCsvDataByName(candidateName, csvFile);
            if (csvMatchedData) {
              csvMatch = csvFile;
              console.log('✓ Match found for:', candidateName, 'in CSV:', csvFile.originalName);
              break;
            }
          }

          if (!csvMatchedData) {
            console.log('✗ No match found for:', candidateName);
          }

          // Parse CSV row if found
          const parsedCsv = csvMatchedData ? parseCsvRow(csvMatchedData) : null;

          return {
            _id: resume._id,
            resumeName: resumeFileName,
            candidateName: candidateName,
            email: parsedCsv?.['Email ID'] || resume.parsedData?.email || "N/A",
            phone: parsedCsv?.['Mobile No'] || resume.parsedData?.phone || "N/A",
            location: `${parsedCsv?.['City'] || ''} ${parsedCsv?.['State'] || ''}`.trim() || resume.parsedData?.location || "N/A",
            skills: parsedCsv?.['Languages'] || resume.parsedData?.skills || "N/A",
            experience: parsedCsv?.['Total Experience'] || resume.parsedData?.experience || "N/A",
            status: resume.status,
            fileSize: resume.fileSize,
            uploadDate: resume.uploadDate || resume.createdAt,
            resumeFile: resume,
            
            // CSV specific fields based on your headers
            csvData: parsedCsv,
            csvMatched: !!csvMatchedData,
            csvFileName: csvMatch?.originalName || "N/A",
            
            // Personal Info
            firstName: parsedCsv?.['First Name'] || "N/A",
            middleName: parsedCsv?.['Middle Name'] || "N/A",
            surname: parsedCsv?.['Surname'] || "N/A",
            city: parsedCsv?.['City'] || "N/A",
            state: parsedCsv?.['State'] || "N/A",
            languages: parsedCsv?.['Languages'] || "N/A",
            maritalStatus: parsedCsv?.['Marital Status'] || "N/A",
            
            // Social Media
            linkedinId: parsedCsv?.['Linkedin ID'] || "N/A",
            facebookId: parsedCsv?.['Facebook ID'] || "N/A",
            instagramId: parsedCsv?.['Instagram ID'] || "N/A",
            snapchat: parsedCsv?.['Snapchat'] || "N/A",
            
            // Professional Info
            sector: parsedCsv?.['Sector'] || "N/A",
            category: parsedCsv?.['Category'] || "N/A",
            product: parsedCsv?.['Product'] || "N/A",
            channel: parsedCsv?.['Channel'] || "N/A",
            currentDesignation: parsedCsv?.['Current Designation'] || "N/A",
            currentDepartment: parsedCsv?.['Current Department'] || "N/A",
            
            // Compensation & Career
            currentCTC: parsedCsv?.['Current CTC'] || "N/A",
            expectedCTC: parsedCsv?.['Expected CTC'] || "N/A",
            noticePeriod: parsedCsv?.['Notice Period'] || "N/A",
            totalExperience: parsedCsv?.['Total Experience'] || "N/A",
            brokerRoll: parsedCsv?.['Broker Roll / Company Roll'] || "N/A",
            jobChangeStatus: parsedCsv?.['Status for Job Change'] || "N/A"
          };
        });

        // Calculate matching statistics
        const totalResumes = combined.length;
        const matchedResumes = combined.filter(c => c.csvMatched).length;
        const unmatchedResumes = totalResumes - matchedResumes;
        const matchRate = totalResumes > 0 ? Math.round((matchedResumes / totalResumes) * 100) : 0;

        setMatchingStats({
          total: totalResumes,
          matched: matchedResumes,
          unmatched: unmatchedResumes,
          matchRate: matchRate
        });

        setCombinedData(combined);
        
        toast.success(`Loaded ${totalResumes} resumes. ${matchedResumes} matched with CSV data.`);
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
        item.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.currentDesignation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.languages.toLowerCase().includes(searchQuery.toLowerCase());

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
      {/* Header - Line 91 */}
<motion.div className="mb-6 sm:mb-8">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
    <div>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2" style={{ color: '#020330' }}>
        Search Resume
      </h1>
      <p className="text-sm sm:text-base text-gray-600">
        View combined resume and candidate details from CSV uploads
      </p>
    </div>
    <button
      onClick={() => { fetchCombinedData(); }}
      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      title="Refresh"
    >
      <FiRefreshCw size={20} />
    </button>
  </div>
</motion.div>

        {/* Matching Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium opacity-90">Total Resumes</p>
              <FiFileText className="text-2xl opacity-75" />
            </div>
            <p className="text-3xl font-bold">{matchingStats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium opacity-90">Matched</p>
              <FiCheckCircle className="text-2xl opacity-75" />
            </div>
            <p className="text-3xl font-bold">{matchingStats.matched}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-5 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium opacity-90">Unmatched</p>
              <FiAlertCircle className="text-2xl opacity-75" />
            </div>
            <p className="text-3xl font-bold">{matchingStats.unmatched}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium opacity-90">Match Rate</p>
              <FiTrendingUp className="text-2xl opacity-75" />
            </div>
            <p className="text-3xl font-bold">{matchingStats.matchRate}%</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search Box */}
            <div className="relative md:col-span-2">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, sector, category, city, designation..."
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
            <p className="text-gray-600">Loading and matching resumes with CSV data...</p>
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
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">City</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Sector</th>
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
                            style={{ backgroundColor: candidate.csvMatched ? '#00C851' : '#FF6666' }}
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
                        {candidate.city}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {candidate.sector}
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
                    style={{ backgroundColor: selectedCandidate.csvMatched ? '#00C851' : '#FF6666' }}
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
                      <label className="text-sm text-gray-600 block mb-1">Sector</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.sector}</p>
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
                      <label className="text-sm text-gray-600 block mb-1">Channel</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.channel}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="text-sm text-gray-600 block mb-1">Current Designation</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.currentDesignation}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="text-sm text-gray-600 block mb-1">Current Department</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.currentDepartment}</p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4" style={{ color: '#020330' }}>
                    👤 Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 block mb-1">City</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.city}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 block mb-1">State</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.state}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-600 block mb-1">Marital Status</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.maritalStatus}</p>
                    </div>
                  </div>
                </div>

                {/* Compensation & Experience */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4" style={{ color: '#020330' }}>
                    💰 Compensation & Experience
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <label className="text-sm text-gray-600 block mb-1">Current CTC</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.currentCTC}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <label className="text-sm text-gray-600 block mb-1">Expected CTC</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.expectedCTC}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <label className="text-sm text-gray-600 block mb-1">Total Experience</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.totalExperience}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <label className="text-sm text-gray-600 block mb-1">Notice Period</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.noticePeriod}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <label className="text-sm text-gray-600 block mb-1">Broker/Company Roll</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.brokerRoll}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <label className="text-sm text-gray-600 block mb-1">Job Change Status</label>
                      <p className="text-gray-900 font-medium">{selectedCandidate.jobChangeStatus}</p>
                    </div>
                  </div>
                </div>

                {/* Social & Technical Links */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4" style={{ color: '#020330' }}>
                    🔗 Social Media Links
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
                      <label className="text-sm text-gray-600 block mb-1">Facebook ID</label>
                      <p className="text-gray-900 font-medium break-all">{selectedCandidate.facebookId}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                      <label className="text-sm text-gray-600 block mb-1">Instagram ID</label>
                      <p className="text-gray-900 font-medium break-all">{selectedCandidate.instagramId}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                      <label className="text-sm text-gray-600 block mb-1">Snapchat</label>
                      <p className="text-gray-900 font-medium break-all">{selectedCandidate.snapchat}</p>
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4" style={{ color: '#020330' }}>
                    🗣️ Languages
                  </h4>
                  <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                    <p className="text-gray-900">{selectedCandidate.languages}</p>
                  </div>
                </div>

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
                    <p className="text-sm text-gray-600 mb-1">
                      This candidate's resume has been matched with CSV data from: <span className="font-medium">{selectedCandidate.csvFileName}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      All details above are automatically populated from the matched CSV file.
                    </p>
                  </div>
                ) : (
                  <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                    <h4 className="text-lg font-semibold mb-2" style={{ color: '#020330' }}>
                      ⚠️ No CSV Match Found
                    </h4>
                    <p className="text-sm text-gray-600 mb-1">
                      This resume could not be matched with any CSV data.
                    </p>
                    <p className="text-xs text-gray-500">
                      Tip: Ensure the candidate name in the resume filename (extracted as: <span className="font-medium">{selectedCandidate.candidateName}</span>) matches the "First Name", "Middle Name", and "Surname" columns in your CSV file.
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
