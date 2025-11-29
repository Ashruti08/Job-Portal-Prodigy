import React, { useState, useContext, useRef, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import * as XLSX from 'xlsx';
import {
  FiUpload,
  FiFile,
  FiTrash2,
  FiDownload,
  FiEye,
  FiFileText,
  FiDatabase,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiRefreshCw
} from "react-icons/fi";

const BulkUpload = () => {
  const { companyToken, backendUrl } = useContext(AppContext);
  const outletContext = useOutletContext();
  const { isLoggedIn, showLoginNotification } = outletContext || {};

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("resumes");
  const [dragActive, setDragActive] = useState(false);
  const [stats, setStats] = useState({
    resumes: { totalResumes: 0, processedResumes: 0, failedResumes: 0, totalSize: 0 },
    csv: { totalCSVs: 0, processedCSVs: 0, failedCSVs: 0, totalRows: 0, totalSize: 0 }
  });
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    file: null,
    data: null,
    type: null
  });
  
  const resumeInputRef = useRef(null);
  const csvInputRef = useRef(null);

  useEffect(() => {
    if (companyToken) {
      fetchUploadedFiles();
      fetchStats();
    }
  }, [companyToken, activeTab]);

  const fetchUploadedFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/bulk-upload/files?type=${activeTab}`, {
        headers: { token: companyToken }
      });

      if (data.success) {
        setUploadedFiles(data.data.files || []);
      } else {
        toast.error(data.message || "Failed to fetch files");
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error(error.response?.data?.message || "Failed to fetch files");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/bulk-upload/stats`, {
        headers: { token: companyToken }
      });

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  if (!companyToken) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-white rounded-xl shadow-md">
        <div className="text-center">
          <FiAlertCircle className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-xl sm:text-2xl text-gray-600 mb-4">Please login as a company first</p>
          <p className="text-gray-500">You need to be logged in to upload files</p>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (files, type) => {
    if (!isLoggedIn) {
      showLoginNotification();
      return;
    }

    if (!files || files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    const filesArray = Array.from(files);
    console.log('Files to upload:', filesArray.length);
    console.log('Upload type:', type);

    const validFiles = filesArray.filter(file => {
      console.log('Checking file:', file.name, 'Type:', file.type);
      
      if (type === "resumes") {
        const isValid = file.type === "application/pdf" || 
               file.name.toLowerCase().endsWith('.pdf') ||
               file.name.toLowerCase().endsWith('.doc') ||
               file.name.toLowerCase().endsWith('.docx') ||
               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               file.type === 'application/msword';
        
        if (!isValid) {
          console.log('Invalid resume file:', file.name);
        }
        return isValid;
      } else {
        const isValid = file.type === "text/csv" || 
               file.name.toLowerCase().endsWith('.csv') ||
               file.type === 'application/csv' ||
               file.type === 'application/vnd.ms-excel' ||
               file.name.toLowerCase().endsWith('.xlsx') ||
               file.name.toLowerCase().endsWith('.xls') ||
               file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
               file.type === 'application/vnd.ms-excel';
        
        if (!isValid) {
          console.log('Invalid CSV/Excel file:', file.name);
        }
        return isValid;
      }
    });

    console.log('Valid files:', validFiles.length);

    if (validFiles.length === 0) {
      toast.error(
        type === "resumes" 
          ? "Please select valid resume files (PDF, DOC, DOCX)"
          : "Please select valid CSV or Excel files (CSV, XLSX, XLS)"
      );
      return;
    }

    if (validFiles.length > 20 && type === "resumes") {
      toast.error("Maximum 20 resume files allowed at once");
      return;
    }

    if (validFiles.length > 10 && type === "csv") {
      toast.error("Maximum 10 CSV/Excel files allowed at once");
      return;
    }

    const maxSize = type === "csv" ? 5 * 1024 * 1024 : 400 * 1024;
    const oversizedFiles = validFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      const sizeLimit = type === "csv" ? "5MB" : "400KB";
      toast.error(`${oversizedFiles.length} file(s) exceed ${sizeLimit} limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      
      const fieldName = type === "resumes" ? 'resumes' : 'csvFiles';
      console.log('Using field name:', fieldName);
      
      validFiles.forEach((file, index) => {
        console.log(`Adding file ${index + 1}:`, file.name, 'Size:', file.size);
        formData.append(fieldName, file);
      });

      if (type === "csv") {
        formData.append('dataType', 'general');
      }

      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]);
      }

      const endpoint = type === "resumes" 
        ? `${backendUrl}/api/bulk-upload/upload-resumes`
        : `${backendUrl}/api/bulk-upload/upload-csv`;

      console.log('Uploading to:', endpoint);

      const { data } = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'token': companyToken
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      });

      console.log('Upload response:', data);

      if (data.success) {
        toast.success(data.message);
        
        await fetchUploadedFiles();
        await fetchStats();
        
        const { processedFiles, failedFiles, totalFiles } = data.data;
        if (failedFiles > 0) {
          toast.warning(`${processedFiles}/${totalFiles} files processed successfully. ${failedFiles} files failed.`);
        }
      } else {
        toast.error(data.message || "Upload failed");
      }
      
    } catch (error) {
      console.error("Upload error:", error);
      console.error("Error response:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || "Failed to upload files. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files, activeTab);
    }
  };

  const removeFile = async (fileId) => {
    try {
      const { data } = await axios.delete(`${backendUrl}/api/bulk-upload/files/${fileId}?type=${activeTab === "resumes" ? "resume" : "csv"}`, {
        headers: { token: companyToken }
      });

      if (data.success) {
        toast.success("File removed successfully");
        await fetchUploadedFiles();
        await fetchStats();
      } else {
        toast.error(data.message || "Failed to remove file");
      }
    } catch (error) {
      console.error("Error removing file:", error);
      toast.error(error.response?.data?.message || "Failed to remove file");
    }
  };

  const canViewFile = (file) => {
    const fileName = file.originalName.toLowerCase();
    const fileType = file.fileType?.toLowerCase();
    
    // PDF files can be viewed
    if (fileType === 'pdf' || fileName.endsWith('.pdf')) {
      return true;
    }
    
    // CSV files can be previewed
    if (fileName.endsWith('.csv') || fileType === 'csv') {
      return true;
    }
    
    // Excel files can be previewed
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
        fileType === 'xlsx' || fileType === 'xls') {
      return true;
    }
    
    return false;
  };

  const viewFile = async (file) => {
    try {
      const fileName = file.originalName.toLowerCase();
      const fileType = file.fileType?.toLowerCase();
      
      const response = await axios.get(`${backendUrl}/api/bulk-upload/download/${file._id}`, {
        headers: { token: companyToken },
        responseType: 'blob'
      });

      // Handle PDF files - open in new tab
      if (fileType === 'pdf' || fileName.endsWith('.pdf')) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      }
      // Handle Word documents - download only (backend will process)
      else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        toast.info("Word documents are processed on the server. Please download to view the file, or the processed text will be available in the resume database.");
        downloadFile(file);
      }
      // Handle CSV files - show preview in modal
      else if (fileName.endsWith('.csv')) {
        try {
          const text = await response.data.text();
          const rows = text.split('\n').map(row => row.split(','));
          setPreviewModal({
            isOpen: true,
            file: file,
            data: rows,
            type: 'csv'
          });
        } catch (error) {
          console.error("Error parsing CSV:", error);
          toast.error("Failed to preview CSV file. Please download to view.");
        }
      }
      // Handle Excel files - show preview in modal
      else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        try {
          const arrayBuffer = await response.data.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          setPreviewModal({
            isOpen: true,
            file: file,
            data: jsonData,
            type: 'excel'
          });
        } catch (error) {
          console.error("Error parsing Excel:", error);
          toast.error("Failed to preview Excel file. Please download to view.");
        }
      }
      else {
        toast.info("This file type cannot be previewed. Please use download instead.");
      }
    } catch (error) {
      console.error("View error:", error);
      toast.error("Failed to view file");
    }
  };

  const downloadFile = async (file) => {
    try {
      const response = await axios.get(`${backendUrl}/api/bulk-upload/download/${file._id}`, {
        headers: { token: companyToken },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    return type === "resume" ? <FiFileText className="text-blue-500" /> : <FiDatabase className="text-green-500" />;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'processed': { bg: 'bg-green-100', text: 'text-green-800', icon: <FiCheck className="mr-1" /> },
      'failed': { bg: 'bg-red-100', text: 'text-red-800', icon: <FiX className="mr-1" /> },
      'processing': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <FiRefreshCw className="mr-1 animate-spin" /> },
      'uploaded': { bg: 'bg-blue-100', text: 'text-blue-800', icon: <FiUpload className="mr-1" /> }
    };

    const config = statusConfig[status] || statusConfig['uploaded'];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="container p-4 mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ color: '#020330' }}
              >
                Bulk Upload
              </h1>
              <p className="text-gray-600">Upload multiple resumes or CSV/Excel files for bulk processing</p>
            </div>
            <button
              onClick={() => {
                fetchUploadedFiles();
                fetchStats();
              }}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw size={20} />
            </button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-8">
          <button
            onClick={() => setActiveTab("resumes")}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === "resumes"
                ? "text-white shadow-md"
                : "text-gray-600 hover:text-gray-800"
            }`}
            style={{ backgroundColor: activeTab === "resumes" ? "#FF0000" : "transparent" }}
          >
            <FiFileText />
            <span>Resume Upload</span>
          </button>
          <button
            onClick={() => setActiveTab("csv")}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === "csv"
                ? "text-white shadow-md"
                : "text-gray-600 hover:text-gray-800"
            }`}
            style={{ backgroundColor: activeTab === "csv" ? "#FF0000" : "transparent" }}
          >
            <FiDatabase />
            <span> </span>
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive 
                ? "border-red-400 bg-red-50" 
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: '#FF0000' }}
              >
                {isUploading ? (
                  <FiRefreshCw className="text-white text-2xl animate-spin" />
                ) : (
                  <FiUpload className="text-white text-2xl" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#020330' }}>
                {activeTab === "resumes" ? "Upload Resume Files" : "Upload CSV or Excel Files"}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {activeTab === "resumes" 
                  ? "Drag and drop PDF, DOC, or DOCX files here, or click to browse (Max 20 files)"
                  : "Drag and drop CSV or Excel files here, or click to browse (Max 10 files)"
                }
              </p>

              <input
                ref={activeTab === "resumes" ? resumeInputRef : csvInputRef}
                type="file"
                multiple
                accept={activeTab === "resumes" ? ".pdf,.doc,.docx" : ".csv,.xlsx,.xls"}
                onChange={(e) => handleFileUpload(e.target.files, activeTab)}
                className="hidden"
                disabled={isUploading}
              />

              <button
                onClick={() => {
                  if (activeTab === "resumes") {
                    resumeInputRef.current?.click();
                  } else {
                    csvInputRef.current?.click();
                  }
                }}
                disabled={isUploading}
                className="px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50"
                style={{ backgroundColor: '#FF0000' }}
              >
                {isUploading ? "Uploading..." : "Browse Files"}
              </button>

              <p className="text-xs text-gray-500 mt-2">
                {activeTab === "resumes" 
                  ? "Supported formats: PDF, DOC, DOCX (Max 400KB each)"
                  : "Supported formats: CSV, XLSX, XLS (Max 5MB each)"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {activeTab === "resumes" ? (
            <>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{ borderLeftColor: '#FF0000' }}>
                <p className="text-gray-500 text-sm mb-1">Total Resumes</p>
                <p className="text-2xl font-bold" style={{ color: '#FF0000' }}>
                  {stats.resumes.totalResumes}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{ borderLeftColor: '#00C851' }}>
                <p className="text-gray-500 text-sm mb-1">Processed</p>
                <p className="text-2xl font-bold" style={{ color: '#00C851' }}>
                  {stats.resumes.processedResumes}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{ borderLeftColor: '#FF4444' }}>
                <p className="text-gray-500 text-sm mb-1">Failed</p>
                <p className="text-2xl font-bold" style={{ color: '#FF4444' }}>
                  {stats.resumes.failedResumes}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{ borderLeftColor: '#2196F3' }}>
                <p className="text-gray-500 text-sm mb-1">Total Size</p>
                <p className="text-2xl font-bold" style={{ color: '#2196F3' }}>
                  {formatFileSize(stats.resumes.totalSize)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{ borderLeftColor: '#FF0000' }}>
                <p className="text-gray-500 text-sm mb-1">Total Files</p>
                <p className="text-2xl font-bold" style={{ color: '#FF0000' }}>
                  {stats.csv.totalCSVs}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{ borderLeftColor: '#00C851' }}>
                <p className="text-gray-500 text-sm mb-1">Processed</p>
                <p className="text-2xl font-bold" style={{ color: '#00C851' }}>
                  {stats.csv.processedCSVs}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{ borderLeftColor: '#FF9800' }}>
                <p className="text-gray-500 text-sm mb-1">Total Rows</p>
                <p className="text-2xl font-bold" style={{ color: '#FF9800' }}>
                  {stats.csv.totalRows.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4" style={{ borderLeftColor: '#2196F3' }}>
                <p className="text-gray-500 text-sm mb-1">Total Size</p>
                <p className="text-2xl font-bold" style={{ color: '#2196F3' }}>
                  {formatFileSize(stats.csv.totalSize)}
                </p>
              </div>
            </>
          )}
        </motion.div>

        {/* Uploaded Files List */}
        {isLoadingFiles ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <FiRefreshCw className="mx-auto text-4xl text-gray-400 mb-4 animate-spin" />
            <p className="text-gray-600">Loading files...</p>
          </div>
        ) : uploadedFiles.length > 0 ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold" style={{ color: '#020330' }}>
                Uploaded {activeTab === "resumes" ? "Resumes" : "Data Files"} ({uploadedFiles.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">File</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Size</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Upload Date</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Status</th>
                    {activeTab === "csv" && (
                      <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Rows</th>
                    )}
                    <th className="py-3 px-6 text-center text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedFiles.map((file, index) => (
                    <motion.tr
                      key={file._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.fileCategory || activeTab)}
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-xs">
                              {file.originalName}
                            </p>
                            {file.metadata?.processingNotes && (
                              <p className="text-xs text-red-500 truncate max-w-xs">
                                {file.metadata.processingNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {formatFileSize(file.fileSize)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {new Date(file.uploadDate || file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(file.status)}
                      </td>
                      {activeTab === "csv" && (
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {file.totalRows?.toLocaleString() || 0}
                        </td>
                      )}
                      <td className="py-4 px-6">
                        <div className="flex justify-center space-x-2">
                          {canViewFile(file) && (
                            <button
                              onClick={() => viewFile(file)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="View File"
                            >
                              <FiEye size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => downloadFile(file)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <FiDownload size={16} />
                          </button>
                          <button
                            onClick={() => removeFile(file._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
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
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              {activeTab === "resumes" ? <FiFileText size={48} /> : <FiDatabase size={48} />}
            </div>
            <p className="text-gray-600">
              No {activeTab === "resumes" ? "resumes" : "data files"} uploaded yet
            </p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewModal({ isOpen: false, file: null, data: null, type: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <FiEye className="text-2xl" style={{ color: '#FF0000' }} />
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: '#020330' }}>
                      File Preview
                    </h3>
                    <p className="text-sm text-gray-600">{previewModal.file?.originalName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewModal({ isOpen: false, file: null, data: null, type: null })}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-auto p-6">
                {previewModal.data && previewModal.data.length > 0 ? (
                  // CSV/Excel Table Preview
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {previewModal.data[0].map((header, index) => (
                            <th
                              key={index}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                            >
                              {header || `Column ${index + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewModal.data.slice(1, 101).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewModal.data.length > 101 && (
                      <div className="mt-4 text-center text-sm text-gray-600">
                        Showing first 100 rows of {previewModal.data.length - 1} total rows
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No data to display
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => downloadFile(previewModal.file)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiDownload />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewModal({ isOpen: false, file: null, data: null, type: null })}
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

export default BulkUpload;
