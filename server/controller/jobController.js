import Job from "../models/Job.js";

// Get all jobs 
export const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ visible: true})
            .populate({path: "companyId", select: "-password"})
        
        res.json({success: true, data: jobs}) // ← Changed from "jobs" to "data"
    } catch (error) {
        res.status(500).json({success: false, message: error.message}) // ← Added status code
    }
};

// Get a single job by ID
export const getJobById = async (req, res) => {
    try {
        const {id} = req.params
        const job = await Job.findById(id)
        .populate({
            path:"companyId",
            select:"-password",
        })
        
        if(!job){
            return res.status(404).json({ // ← Added status code
                success:false,
                message:"Job not found"
            })
        }

        res.json({
            success:true,
            data: job // ← Changed from "job" to "data"
        })
    } catch (error) {
        res.status(500).json({success: false, message: error.message}) // ← Added status code
    }
}