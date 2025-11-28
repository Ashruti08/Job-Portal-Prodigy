import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { User, Mail, Trash2, Plus, Shield, Eye, EyeOff, Key, X, CheckCircle, Copy, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MyTeam = () => {
  const { backendUrl, companyToken } = useContext(AppContext);
  const [subUsers, setSubUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdMemberData, setCreatedMemberData] = useState(null);
  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    password: '', 
    roleType: 'hr',
    permissions: {
      canPostJobs: false,
      canManageBulkUpload: false,
      canViewApplications: true
    }
  });

  const fetchSubUsers = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/company/subusers`, {
        headers: { token: companyToken }
      });
      if (data.success) {
        setSubUsers(data.subUsers);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch team');
    }
  };

  useEffect(() => {
    if (companyToken) fetchSubUsers();
  }, [companyToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill all fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/company/create-subuser`,
        formData,
        { headers: { token: companyToken } }
      );
      
      if (data.success) {
        setCreatedMemberData({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roleType: formData.roleType,
          permissions: formData.permissions
        });
        
        setShowSuccessModal(true);
        
        setFormData({ 
          name: '', 
          email: '', 
          password: '', 
          roleType: 'hr',
          permissions: {
            canPostJobs: false,
            canManageBulkUpload: false,
            canViewApplications: true
          }
        });
        setShowAddForm(false);
        
        fetchSubUsers();
      } else {
        toast.error(data.message || 'Failed to add team member');
      }
    } catch (error) {
      console.error('Add member error:', error);
      toast.error(error.response?.data?.message || 'Failed to add team member');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this team member?')) return;
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/company/subuser/${id}`,
        { headers: { token: companyToken } }
      );
      if (data.success) {
        toast.success(data.message);
        fetchSubUsers();
      } else {
        toast.error(data.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove team member');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!selectedUser || !selectedUser._id) {
      toast.error('Invalid user selected');
      return;
    }

    try {
      setLoading(true);
      
      const { data } = await axios.put(
        `${backendUrl}/api/company/subuser/${selectedUser._id}/reset-password`,
        { newPassword },
        { headers: { token: companyToken } }
      );
      
      if (data.success) {
        toast.success('Password reset successfully');
        setShowResetModal(false);
        setNewPassword('');
        setSelectedUser(null);
        setShowNewPassword(false);
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedUser || !selectedUser._id) {
      toast.error('Invalid user selected');
      return;
    }

    try {
      setLoading(true);
      
      const { data } = await axios.put(
        `${backendUrl}/api/company/subuser/${selectedUser._id}/permissions`,
        { permissions: selectedUser.permissions },
        { headers: { token: companyToken } }
      );
      
      if (data.success) {
        toast.success('Permissions updated successfully');
        setShowPermissionsModal(false);
        setSelectedUser(null);
        fetchSubUsers();
      } else {
        toast.error(data.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Update permissions error:', error);
      toast.error(error.response?.data?.message || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      hr: 'bg-blue-100 text-blue-700',
      consultancy: 'bg-purple-100 text-purple-700',
      management: 'bg-green-100 text-green-700'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[role]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getPermissionBadges = (permissions) => {
    const badges = [];
    
    if (permissions?.canPostJobs) {
      badges.push(
        <span key="jobs" className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
          📝 Post Jobs
        </span>
      );
    }
    
    if (permissions?.canManageBulkUpload) {
      badges.push(
        <span key="bulk" className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
          📁 Bulk Upload
        </span>
      );
    }
    
    if (!badges.length) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
          👁️ View Only
        </span>
      );
    }
    
    return badges;
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success('Password copied to clipboard!');
      }).catch(() => {
        toast.error('Failed to copy password');
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Password copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy password');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Assessment Team</h1>
          <p className="text-gray-500 mt-1">Manage access for HR, Consultancy & Management</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          <Plus size={18} />
          Add Team Member
        </button>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold mb-4">Add New Team Member</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="px-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <select
              value={formData.roleType}
              onChange={(e) => setFormData({...formData, roleType: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="hr">HR</option>
              <option value="consultancy">Consultancy</option>
              <option value="management">Management</option>
            </select>
          </div>

          {/* Permissions Section */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Settings size={16} />
              Access Permissions
            </h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.canViewApplications}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      canViewApplications: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                  disabled
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">View & Assess Applications</p>
                  <p className="text-xs text-gray-500">Access candidate applications and fill assessments (Always enabled)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.canPostJobs}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      canPostJobs: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Post & Manage Jobs</p>
                  <p className="text-xs text-gray-500">Create, edit, and manage job postings</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.canManageBulkUpload}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      canManageBulkUpload: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Bulk Upload & Search Resume</p>
                  <p className="text-xs text-gray-500">Upload resumes/CSV files and search resume database</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormData({ 
                  name: '', 
                  email: '', 
                  password: '', 
                  roleType: 'hr',
                  permissions: {
                    canPostJobs: false,
                    canManageBulkUpload: false,
                    canViewApplications: true
                  }
                });
              }}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Permissions</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  <Shield size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No team members yet</p>
                  <p className="text-sm mt-1">Add your first team member to get started!</p>
                </td>
              </tr>
            ) : (
              subUsers.map((user) => (
                <tr key={user._id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={16} className="text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.roleType)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {getPermissionBadges(user.permissions)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPermissionsModal(true);
                        }}
                        className="text-purple-500 hover:text-purple-700 transition-colors p-2 hover:bg-purple-50 rounded"
                        title="Manage permissions"
                      >
                        <Settings size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowResetModal(true);
                        }}
                        className="text-blue-500 hover:text-blue-700 transition-colors p-2 hover:bg-blue-50 rounded"
                        title="Reset password"
                      >
                        <Key size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded"
                        title="Remove team member"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Permissions Modal */}
      <AnimatePresence>
        {showPermissionsModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowPermissionsModal(false);
              setSelectedUser(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Manage Permissions</h3>
                <button
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Editing permissions for: <strong>{selectedUser.name}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">{selectedUser.email}</p>
              </div>

              <div className="space-y-4 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUser.permissions?.canViewApplications !== false}
                    disabled
                    className="mt-1 w-4 h-4 text-red-500 rounded focus:ring-red-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">View & Assess Applications</p>
                    <p className="text-xs text-gray-500">Always enabled - core team member function</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUser.permissions?.canPostJobs || false}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      permissions: {
                        ...selectedUser.permissions,
                        canPostJobs: e.target.checked
                      }
                    })}
                    className="mt-1 w-4 h-4 text-red-500 rounded focus:ring-red-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Post & Manage Jobs</p>
                    <p className="text-xs text-gray-500">Allow creating and managing job postings</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUser.permissions?.canManageBulkUpload || false}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      permissions: {
                        ...selectedUser.permissions,
                        canManageBulkUpload: e.target.checked
                      }
                    })}
                    className="mt-1 w-4 h-4 text-red-500 rounded focus:ring-red-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Bulk Upload & Search Resume</p>
                    <p className="text-xs text-gray-500">Upload resumes/CSV and search database</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdatePermissions}
                  disabled={loading}
                  className="flex-1 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Permissions'}
                </button>
                <button
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowResetModal(false);
              setNewPassword('');
              setSelectedUser(null);
              setShowNewPassword(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Reset Password</h3>
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setNewPassword('');
                    setSelectedUser(null);
                    setShowNewPassword(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Resetting password for: <strong>{selectedUser.name}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">{selectedUser.email}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="px-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleResetPassword}
                  disabled={loading || !newPassword || newPassword.length < 6}
                  className="flex-1 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setNewPassword('');
                    setSelectedUser(null);
                    setShowNewPassword(false);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && createdMemberData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
                Team Member Added!
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Save these credentials and share with the team member
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Name</label>
                    <p className="text-gray-800 font-semibold">{createdMemberData.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Email</label>
                    <p className="text-gray-800 font-semibold">{createdMemberData.email}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Role</label>
                    <div className="mt-1">
                      {getRoleBadge(createdMemberData.roleType)}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 font-medium">Permissions</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {getPermissionBadges(createdMemberData.permissions)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4">
                <label className="text-xs text-amber-700 font-bold uppercase mb-2 block">
                  🔐 Login Password
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border border-amber-200 font-mono text-lg font-bold text-gray-800 break-all">
                    {createdMemberData.password}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdMemberData.password)}
                    className="p-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors flex-shrink-0"
                    title="Copy password"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700 font-medium flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>
                    <strong>Important:</strong> This password will not be shown again! 
                    Make sure to save it or send it to the team member now.
                  </span>
                </p>
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setCreatedMemberData(null);
                }}
                className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Got it! Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyTeam;