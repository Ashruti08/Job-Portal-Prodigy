import express from 'express';
import CandidateAssessment from '../models/CandidateAssessment.js';

const router = express.Router();

// @desc    Get existing assessment by email  
// @route   GET /api/candidates/assessment/email/:email
// @access  Public
router.get('/assessment/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log('Fetching assessment for email:', email);
    
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }
    
    // Find assessment by candidate email
    const assessment = await CandidateAssessment.findOne({ 
      candidateEmail: email.toLowerCase().trim() 
    });
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'No assessment found for this candidate'
      });
    }
    
    console.log('Found assessment:', assessment._id);
    
    res.json({
      success: true,
      assessment: assessment
    });
    
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assessment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Create new candidate assessment or update existing one
// @route   POST /api/candidates/assessment
// @access  Public
router.post('/assessment', async (req, res) => {
  try {
    console.log('=== Candidate Assessment Submission ===');
    console.log('Request body:', req.body);

    const {
      candidateName,
      candidateEmail,
      candidatePhone,
      // Step 1 data
      consultancy,
      financialStatus,
      dailyCommute,
      aspirations,
      moneyAttitude,
      loyaltyBehavior,
      workStyle,
      pressureHandling,
      roleClarityNeed,
      // Step 2 data
      fear1,
      motivation1,
      challenge1,
      powerLanguage1,
      companyPriority1,
      // Step 3 data
      targets,
      references,
      softwares,
      productKnowledge,
      sourceOfRevenue
    } = req.body;

    // Validate required field
    if (!candidateName || !candidateName.trim()) {
      console.log('Validation failed: candidateName is required');
      return res.status(400).json({
        success: false,
        message: 'Candidate name is required'
      });
    }

    // Check if assessment already exists for this email
    let existingAssessment = null;
    if (candidateEmail && candidateEmail.trim()) {
      existingAssessment = await CandidateAssessment.findOne({ 
        candidateEmail: candidateEmail.toLowerCase().trim()
      });
    }

    if (existingAssessment) {
      console.log('Assessment exists, updating...');
      
      // Update existing assessment
      const updateData = {
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail ? candidateEmail.toLowerCase().trim() : undefined,
        candidatePhone: candidatePhone ? candidatePhone.trim() : undefined,
        consultancy,
        financialStatus,
        dailyCommute,
        aspirations,
        moneyAttitude,
        loyaltyBehavior,
        workStyle,
        pressureHandling,
        roleClarityNeed,
        fear1,
        motivation1,
        challenge1,
        powerLanguage1,
        companyPriority1,
        targets,
        references,
        softwares,
        productKnowledge,
        sourceOfRevenue,
        assessmentStatus: 'completed',
        lastUpdated: new Date()
      };

      const updatedAssessment = await CandidateAssessment.findByIdAndUpdate(
        existingAssessment._id,
        updateData,
        { new: true, runValidators: true }
      );

      console.log('Assessment updated successfully:', updatedAssessment._id);
      
      return res.json({
        success: true,
        message: 'Assessment updated successfully',
        data: {
          id: updatedAssessment._id,
          candidateName: updatedAssessment.candidateName,
          lastUpdated: updatedAssessment.lastUpdated
        }
      });
    }

    console.log('Creating new assessment...');

    // Create new assessment
    const assessment = new CandidateAssessment({
      candidateName: candidateName.trim(),
      candidateEmail: candidateEmail ? candidateEmail.toLowerCase().trim() : undefined,
      candidatePhone: candidatePhone ? candidatePhone.trim() : undefined,
      consultancy,
      financialStatus,
      dailyCommute,
      aspirations,
      moneyAttitude,
      loyaltyBehavior,
      workStyle,
      pressureHandling,
      roleClarityNeed,
      fear1,
      motivation1,
      challenge1,
      powerLanguage1,
      companyPriority1,
      targets,
      references,
      softwares,
      productKnowledge,
      sourceOfRevenue,
      assessmentStatus: 'completed'
    });

    const savedAssessment = await assessment.save();
    console.log('Assessment saved successfully:', savedAssessment._id);

    res.status(201).json({
      success: true,
      message: 'Assessment submitted successfully',
      data: {
        id: savedAssessment._id,
        candidateName: savedAssessment.candidateName,
        submittedAt: savedAssessment.submittedAt
      }
    });

  } catch (error) {
    console.error('Error creating/updating assessment:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.log('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while processing assessment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update existing candidate assessment
// @route   PUT /api/candidates/assessment/email/:email
// @access  Public
router.put('/assessment/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const assessmentData = req.body;
    
    console.log('Updating assessment for email:', email);
    console.log('Update data:', assessmentData);
    
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }
    
    // Validate required field
    if (!assessmentData.candidateName || !assessmentData.candidateName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Candidate name is required'
      });
    }
    
    // Ensure email consistency and clean data
    if (assessmentData.candidateEmail) {
      assessmentData.candidateEmail = assessmentData.candidateEmail.toLowerCase().trim();
    }
    if (assessmentData.candidateName) {
      assessmentData.candidateName = assessmentData.candidateName.trim();
    }
    if (assessmentData.candidatePhone) {
      assessmentData.candidatePhone = assessmentData.candidatePhone.trim();
    }
    
    // Update lastUpdated timestamp
    assessmentData.lastUpdated = new Date();
    assessmentData.assessmentStatus = 'completed';
    
    // Find and update the assessment
    const updatedAssessment = await CandidateAssessment.findOneAndUpdate(
      { candidateEmail: email.toLowerCase().trim() },
      assessmentData,
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validation
      }
    );
    
    if (!updatedAssessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found for this candidate'
      });
    }
    
    console.log('Assessment updated successfully:', updatedAssessment._id);
    
    res.json({
      success: true,
      message: 'Assessment updated successfully',
      data: {
        id: updatedAssessment._id,
        candidateName: updatedAssessment.candidateName,
        lastUpdated: updatedAssessment.lastUpdated
      }
    });
    
  } catch (error) {
    console.error('Error updating assessment:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.log('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating assessment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get all assessments
// @route   GET /api/candidates/assessments
// @access  Private
router.get('/assessments', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.assessmentStatus = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { candidateName: { $regex: req.query.search, $options: 'i' } },
        { candidateEmail: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const assessments = await CandidateAssessment
      .find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await CandidateAssessment.countDocuments(filter);

    res.json({
      success: true,
      data: assessments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assessments'
    });
  }
});

// @desc    Get single assessment by ID
// @route   GET /api/candidates/assessment/:id
// @access  Private
router.get('/assessment/:id', async (req, res) => {
  try {
    const assessment = await CandidateAssessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      data: assessment
    });

  } catch (error) {
    console.error('Error fetching assessment:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid assessment ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching assessment'
    });
  }
});

export default router;