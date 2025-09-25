import mongoose from "mongoose";

const employerProfileSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        unique: true
    },
    location: { 
        type: String,
        trim: true,
        maxlength: [200, 'Location cannot exceed 200 characters']
    },
    website: { 
        type: String,
        trim: true,
        match: [
            /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
            'Please enter a valid URL'
        ]
    },
    companySize: { 
        type: String,
        trim: true,
        maxlength: [50, 'Company size cannot exceed 50 characters']
    },
    description: { 
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    stats: {
        activeJobs: { 
            type: Number, 
            default: 0,
            min: [0, 'Active jobs cannot be negative']
        },
        totalApplications: { 
            type: Number, 
            default: 0,
            min: [0, 'Total applications cannot be negative']
        },
        totalHired: { 
            type: Number, 
            default: 0,
            min: [0, 'Total hired cannot be negative']
        }
    }
}, { 
    timestamps: true,
    toObject: { getters: true },
    toJSON: { getters: true }
});

const EmployerProfile = mongoose.model('EmployerProfile', employerProfileSchema);

export default EmployerProfile;