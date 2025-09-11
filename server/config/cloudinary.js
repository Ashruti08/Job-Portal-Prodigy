import { v2 as cloudinary } from 'cloudinary';

const connectCloudinary = async () => {
  try {
    // Debug log to check if env variables are loaded
    console.log('🔍 Cloudinary Config Check:');
    console.log('CLOUDINARY_NAME:', process.env.CLOUDINARY_NAME);
    console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
    console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing');

    if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Missing Cloudinary environment variables');
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    // Test the connection
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connected successfully:', result);
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    throw error;
  }
};

export default connectCloudinary;
export { cloudinary };