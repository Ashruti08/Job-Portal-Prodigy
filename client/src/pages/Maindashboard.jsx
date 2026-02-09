import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import {
  FiUsers,
  FiCalendar,
  FiMail,
  FiBriefcase,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiTarget,
  FiAward,
  FiClock
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const MainDashboard = () => {
  const { companyData } = useContext(AppContext);
  const [timeFilter, setTimeFilter] = useState('This Month');

  // Mock data for demonstration - Replace with actual API data
  const stats = {
    candidatesAdded: { value: 3600, change: '+10%', comparison: 'vs last quarter', subtitle: '↑ last clean segment: 2%+ for reminder' },
    interviewsConducted: { value: 1650, change: '+15%', comparison: 'vs last month', subtitle: '⚬ 98% Conductor Experience Invitations' },
    offersSent: { value: 900, change: '+25%', comparison: 'vs last month', subtitle: '⚬ Offer Budget: $40 K +25%' },
    joinings: { value: 540, change: '+20%', comparison: 'vs last month', subtitle: '⚬ Cohort Efficiencies' }
  };

  const pipelineData = [
    { stage: 'Applied', value: 1200, percentage: 75, change: '+75%', subText: '↓ Exits' },
    { stage: 'Screened', value: 2700, percentage: 83, change: '+83%', subText: '↓ 40%' },
    { stage: 'Interview', value: 1650, percentage: 58, change: '+58%', subText: '↓ 40%' },
    { stage: 'Offer', value: 900, percentage: 55, change: '+55%', subText: '↓ 45%' },
    { stage: 'Joined', value: 540, percentage: 60, change: '+60%', subText: '↓ 60%', conversionRate: '60%', trend: '+12.5%' }
  ];

  const recruitmentTrends = [
    { month: 'Jan.', candidates: 200, interviews: 150, offers: 100, joinings: 80 },
    { month: 'Feb.', candidates: 280, interviews: 200, offers: 130, joinings: 100 },
    { month: 'Mar.', candidates: 350, interviews: 250, offers: 160, joinings: 130 },
    { month: 'May.', candidates: 450, interviews: 340, offers: 220, joinings: 170 },
    { month: 'Jun.', candidates: 600, interviews: 480, offers: 300, joinings: 230 },
    { month: 'Jun.', candidates: 750, interviews: 580, offers: 380, joinings: 290 },
    { month: 'Aug', candidates: 900, interviews: 700, offers: 480, joinings: 360 },
    { month: 'Sept.', candidates: 1100, interviews: 850, offers: 620, joinings: 470 },
    { month: 'Q3', candidates: 1200, interviews: 950, offers: 700, joinings: 540 }
  ];

  const sourceOfHire = [
    { name: 'LinkedIn', value: 420, percentage: 25, change: '+29%', color: '#2ecc71' },
    { name: 'Referrals', value: 300, percentage: 34, change: '+23%', color: '#3498db' },
    { name: 'Job Portals', value: 260, percentage: 20, change: '+17%', color: '#f39c12' },
    { name: 'Database', value: 240, percentage: 30, change: '+25%', color: '#e67e22' }
  ];

  const jobPerformance = [
    { title: 'Sales Manager', company: 'TechCorp', candidates: 200, interviewed: 120, offered: 80, joined: 40, efficiency: '50%', trend: '+12.2%' },
    { title: 'Software Engineer', company: 'Webs Startles', candidates: 300, interviewed: 200, offered: 150, joined: 70, efficiency: '3%', trend: '+19.9%' },
    { title: 'Marketing Specialist', company: 'Global Media', candidates: 150, interviewed: 60, offered: 30, joined: 15, efficiency: '66.7%', trend: '+110%' }
  ];

  const recruiterPerformance = [
    { name: 'John', score: 14.5, speed: 60, offer: 55, joining: 60, strongOff: 39 },
    { name: 'Sarah', score: 20.4, speed: 55, offer: 58, joining: 62, strongOff: 42 },
    { name: 'Mike', score: 10.7, speed: 65, offer: 60, joining: 58, strongOff: 35 },
    { name: 'Eva', score: 23.1, speed: 70, offer: 65, joining: 68, strongOff: 45 }
  ];

  const efficiencyScore = {
    speed: { value: 60, label: 'Speed', status: 'High' },
    offer: { value: 55, label: 'Offer', status: 'Low', change: '25%' },
    joining: { value: 60, label: 'Joining', status: 'Medium', change: '45%' },
    overall: { value: 40, label: 'Offer', status: 'Low', change: '40%' }
  };

  const COLORS = ['#2ecc71', '#3498db', '#f39c12', '#e67e22', '#e74c3c'];

  return (
    <div className="space-y-6">
      {/* Header with Time Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Recruitment Analytics Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          {['Today', 'This Month', 'This Quarter', 'This Year', 'Custom'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeFilter === filter
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Candidates Added */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FiUsers className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Candidates Added</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.candidatesAdded.value.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-sm font-semibold">{stats.candidatesAdded.change}</span>
            <span className="text-gray-500 text-xs">{stats.candidatesAdded.comparison}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">{stats.candidatesAdded.subtitle}</p>
        </motion.div>

        {/* Interviews Conducted */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FiCalendar className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Interviews Conducted</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.interviewsConducted.value.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-sm font-semibold">{stats.interviewsConducted.change}</span>
            <span className="text-gray-500 text-xs">{stats.interviewsConducted.comparison}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">{stats.interviewsConducted.subtitle}</p>
        </motion.div>

        {/* Offers Sent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FiMail className="text-orange-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Offers Sent</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.offersSent.value.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-sm font-semibold">{stats.offersSent.change}</span>
            <span className="text-gray-500 text-xs">{stats.offersSent.comparison}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">{stats.offersSent.subtitle}</p>
        </motion.div>

        {/* Joinings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiBriefcase className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Joinings</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.joinings.value.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-sm font-semibold">{stats.joinings.change}</span>
            <span className="text-gray-500 text-xs">{stats.joinings.comparison}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">{stats.joinings.subtitle}</p>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Pipeline Funnel - Spans 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Candidate Pipeline Funnel</h2>
            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Quarter</option>
            </select>
          </div>

          {/* Funnel Visualization */}
          <div className="space-y-4">
            {pipelineData.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex items-center gap-4 mb-2">
                  <div 
                    className="flex-1 rounded-lg p-4 text-white font-semibold transition-all hover:scale-105"
                    style={{
                      backgroundColor: index === 0 ? '#27ae60' : 
                                     index === 1 ? '#3498db' : 
                                     index === 2 ? '#5b7db1' : 
                                     index === 3 ? '#f39c12' : '#2ecc71',
                      width: `${100 - (index * 10)}%`
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span>{stage.stage}</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{stage.value.toLocaleString()}</div>
                        {stage.conversionRate && (
                          <div className="text-sm bg-green-700 px-2 py-1 rounded mt-1 inline-block">
                            {stage.conversionRate}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm opacity-90">
                      <span>{stage.change}</span>
                      <span>{stage.subText}</span>
                    </div>
                  </div>
                </div>
                {index < pipelineData.length - 1 && (
                  <div className="flex items-center gap-2 my-2 text-sm text-gray-600">
                    <FiTrendingUp className="text-green-600" />
                    <span>{stage.percentage}%</span>
                    <span className="text-red-600">↓ {pipelineData[index + 1]?.value.toLocaleString()}</span>
                  </div>
                )}
                {stage.trend && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <FiTrendingUp className="text-green-600" />
                    <span className="text-green-600 font-semibold">{stage.trend}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recruitment Efficiency Score */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Recruitment Efficiency Score</h2>
          
          <div className="space-y-4">
            {Object.entries(efficiencyScore).map(([key, data]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">{data.label}:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{data.value}%</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      data.status === 'High' ? 'bg-green-100 text-green-700' : 
                      data.status === 'Low' ? 'bg-red-100 text-red-700' : 
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {data.status}
                    </span>
                  </div>
                </div>
                {data.change && (
                  <div className="flex items-center gap-1 text-xs">
                    <FiTrendingDown className="text-red-500" />
                    <span className="text-red-500">{data.change}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Stage-Wise Drop-Off Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">High</span>
                <div className="flex items-center gap-1">
                  <FiTrendingUp className="text-green-600" />
                  <span className="text-sm font-bold text-green-600">25%</span>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">High</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Medium</span>
                <div className="flex items-center gap-1">
                  <FiTrendingDown className="text-red-600" />
                  <span className="text-sm font-bold text-red-600">39%</span>
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">35%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Critical</span>
                <div className="flex items-center gap-1">
                  <FiTrendingDown className="text-red-600" />
                  <span className="text-sm font-bold text-red-600">45%</span>
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">40%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recruitment Activity Trends */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Recruitment Activity Trends</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Month</button>
            <button className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg">Q3</button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={recruitmentTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="candidates" stroke="#3498db" strokeWidth={2} dot={{ r: 4 }} name="Candidates" />
            <Line type="monotone" dataKey="interviews" stroke="#9b59b6" strokeWidth={2} dot={{ r: 4 }} name="Interviews" />
            <Line type="monotone" dataKey="offers" stroke="#e67e22" strokeWidth={2} dot={{ r: 4 }} name="Offers" />
            <Line type="monotone" dataKey="joinings" stroke="#27ae60" strokeWidth={2} dot={{ r: 4 }} name="Joinings" />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">15%</div>
            <div className="text-xs text-gray-500">Growth Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">20%</div>
            <div className="text-xs text-gray-500">Conversion</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">60%</div>
            <div className="text-xs text-gray-500">Efficiency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">12.5%</div>
            <div className="text-xs text-gray-500">Improvement</div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Source of Hire, Job Performance, Recruiter Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source of Hire */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Source of Hire</h2>
            <span className="text-xs text-gray-500">Candidates: 4:20 → 00 Joining: 15%</span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={sourceOfHire}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
              >
                {sourceOfHire.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-3 mt-4">
            {sourceOfHire.map((source) => (
              <div key={source.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></div>
                  <span className="text-sm text-gray-700">{source.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{source.value}</span>
                  <FiTrendingUp className="text-green-600 text-xs" />
                  <span className="text-xs text-green-600">{source.change}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Overall Joining: <span className="font-bold text-gray-800">15%</span></div>
            <div className="text-xs text-gray-500 mt-1">Expenses Score: <span className="font-bold">$3.4</span></div>
          </div>
        </div>

        {/* Job Performance */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Job Performance</h2>
          
          <div className="space-y-4">
            {jobPerformance.map((job) => (
              <div key={job.title} className="border-b border-gray-100 pb-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{job.title}</h3>
                    <p className="text-xs text-gray-500">{job.company}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${
                    parseFloat(job.trend) > 15 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {job.trend}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <div className="font-bold text-gray-800">{job.candidates}</div>
                    <div className="text-gray-500">Applied</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{job.interviewed}</div>
                    <div className="text-gray-500">Interview</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{job.offered}</div>
                    <div className="text-gray-500">Offer</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{job.efficiency}</div>
                    <div className="text-gray-500">Rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recruiter Performance */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Recruiter Performance</h2>
          
          {/* Performance Gauge */}
          <div className="flex justify-center mb-6">
            <div className="relative w-48 h-24">
              <svg viewBox="0 0 200 100" className="w-full h-full">
                <path
                  d="M 20 80 A 80 80 0 0 1 180 80"
                  fill="none"
                  stroke="#fee"
                  strokeWidth="20"
                />
                <path
                  d="M 20 80 A 80 80 0 0 1 180 80"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="20"
                  strokeDasharray="251"
                  strokeDashoffset="50"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#e74c3c" />
                    <stop offset="50%" stopColor="#f39c12" />
                    <stop offset="100%" stopColor="#27ae60" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800">84</div>
                  <div className="text-xs text-gray-500">Score</div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <FiTrendingUp className="text-green-600" />
                <span className="text-lg font-bold">60</span>
              </div>
              <div className="text-xs text-gray-500">Speed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">55%</div>
              <div className="text-xs text-gray-500">Offer</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">60%</div>
              <div className="text-xs text-gray-500">Joining</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <FiTrendingUp className="text-green-600" />
                <span className="text-lg font-bold">39</span>
              </div>
              <div className="text-xs text-gray-500">Strong Off</div>
            </div>
          </div>

          {/* Individual Performance */}
          <div className="space-y-2">
            {recruiterPerformance.map((recruiter) => (
              <div key={recruiter.name} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 w-16">{recruiter.name}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${recruiter.score * 4}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-800 w-12">{recruiter.score}%</span>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            <span className="text-red-600">↓9% overall comp.</span> LMS are low value add
          </div>
        </div>
      </div>

      {/* Speed & Efficiency Ratios */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Speed & Efficiency Ratios</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={[
                { name: 'John', value: 75 },
                { name: 'Sarah', value: 65 }
              ]}>
                <Bar dataKey="value" fill="#3498db" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2">
              <div className="text-sm font-semibold">Time to Interview</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <FiTrendingUp className="text-green-600" />
                <span className="text-xs text-green-600">+10%</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={[
                { name: 'Mike', value: 80 },
                { name: 'Eva', value: 70 }
              ]}>
                <Bar dataKey="value" fill="#27ae60" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2">
              <div className="text-sm font-semibold">Interview to Offer</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <FiTrendingUp className="text-green-600" />
                <span className="text-xs text-green-600">+10%</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={[
                { name: 'John', value: 60 },
                { name: 'Sarah', value: 85 }
              ]}>
                <Bar dataKey="value" fill="#f39c12" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2">
              <div className="text-sm font-semibold">Offer to Current</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <FiTrendingUp className="text-green-600" />
                <span className="text-xs text-green-600">+10%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-xl font-bold text-blue-600">
              <FiClock />
              <span>8.6 Days</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">Average Time to Interview</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-xl font-bold text-green-600">
              <FiTarget />
              <span>7.5 Days</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">Average Time to Offer</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;