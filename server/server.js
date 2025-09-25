import './config/instrument.js'
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import 'dotenv/config'
import connectDB from "./config/db.js";
import * as Sentry from "@sentry/node";
import { clerkWebhooks } from './controller/webhooks.js';
import companyRoutes from './routes/companyRoutes.js'
import connectCloudinary from './config/cloudinary.js';
import JobRoutes from './routes/jobRoutes.js';
import jobAlertRoutes from './routes/JobAlert.js'; // Fixed import
import userRoutes from './routes/userRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js'; // Add candidate routes
import { clerkMiddleware } from '@clerk/express';
import companyAuthMiddleware from './middleware/companyAuthMiddleware.js';
import { startJobAlertSystem } from './services/jobAlerts.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import employerProfileRoutes from './routes/employerProfileRoutes.js';


// ES6 __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();

// Connect to MongoDB
await connectDB();
startJobAlertSystem();
await connectCloudinary();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(clerkMiddleware());

// Request logging middleware (optional)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.get("/", (req, res) => res.send("API Working"));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

Sentry.setupExpressErrorHandler(app);

// Fixed route usage
app.use('/api/job-alerts', jobAlertRoutes);
app.use('/api/candidates', candidateRoutes); // Add candidate routes

app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
});

app.post('/webhooks', clerkWebhooks)
app.use('/api/company', companyRoutes)
app.use('/api/jobs', JobRoutes)
app.use('/api/users', userRoutes)
app.use('/api/employer', employerProfileRoutes);


// Add this to your backend
app.get('/api/company/resume/:filename', companyAuthMiddleware, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
     
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start the server
const port = process.env.PORT ;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});