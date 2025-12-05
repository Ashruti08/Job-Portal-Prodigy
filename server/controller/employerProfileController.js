import EmployerProfile from '../models/EmployerProfile.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';

export const getEmployerProfile = async (req, res) => {
    try {
        const companyId = req.company._id;

        let [company, profile] = await Promise.all([
            Company.findById(companyId).select('-password'),
            EmployerProfile.findOne({ companyId })
        ]);

        // Calculate real-time stats
        const [activeJobs, totalApplications, totalHired] = await Promise.all([
            Job.countDocuments({ companyId, visible: true }),
            JobApplication.countDocuments({ companyId }),
            JobApplication.countDocuments({ companyId, status: 'Accepted' })
        ]);

        const realStats = { activeJobs, totalApplications, totalHired };

        if (!profile) {
            profile = await EmployerProfile.create({
                companyId,
                location: '',
                website: '',
                companySize: '',
                description: '',
                stats: realStats
            });
        } else {
            // Update existing profile with real-time stats
            profile.stats = realStats;
            await profile.save();
        }

        res.status(200).json({
            success: true,
            data: {
                ...profile.toObject(),
                name: company.name,
                email: company.email,
                phone: company.phone,
                image: company.image
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};

export const updateEmployerProfile = async (req, res) => {
    try {
        const companyId = req.company._id;
        const {
            name,
            email,
            phone,
            location,
            website,
            companySize,
            description
        } = req.body;

        // Calculate real-time stats
        const [activeJobs, totalApplications, totalHired] = await Promise.all([
            Job.countDocuments({ companyId, visible: true }),
            JobApplication.countDocuments({ companyId }),
            JobApplication.countDocuments({ companyId, status: 'Accepted' })
        ]);

        const realStats = { activeJobs, totalApplications, totalHired };
              
        // Update both company and profile in parallel
        const [company, profile] = await Promise.all([
            Company.findByIdAndUpdate(
                companyId,
                { name, email, phone },
                { new: true }
            ).select('-password'),
            
            EmployerProfile.findOneAndUpdate(
                { companyId },
                {
                    location,
                    website,
                    companySize,
                    description,
                    stats: realStats
                },
                { new: true, upsert: true }
            )
        ]);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                ...profile.toObject(),
                name: company.name,
                email: company.email,
                phone: company.phone,
                image: company.image
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

export const updateProfileStats = async (req, res) => {
    try {
        const companyId = req.company._id;
        
        // Calculate real stats instead of using req.body
        const [activeJobs, totalApplications, totalHired] = await Promise.all([
            Job.countDocuments({ companyId, visible: true }),
            JobApplication.countDocuments({ companyId }),
            JobApplication.countDocuments({ companyId, status: 'Accepted' })
        ]);
           
        const profile = await EmployerProfile.findOneAndUpdate(
            { companyId },
            {
                'stats.activeJobs': activeJobs,
                'stats.totalApplications': totalApplications,
                'stats.totalHired': totalHired
            },
            { new: true, upsert: true }
        );
             
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Stats updated successfully',
            data: profile.stats
        });
        
    } catch (error) {
        console.error('Update stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating stats',
            error: error.message
        });
    }
};