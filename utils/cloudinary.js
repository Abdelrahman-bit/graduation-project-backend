import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config({ path: '../config.env' });

cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET,
   secure: true,
});

export const deleteResources = async (publicIds) => {
   if (!publicIds || publicIds.length === 0) {
      return;
   }
   try {
      await cloudinary.api.delete_resources(publicIds);
   } catch (error) {
      console.error('Error deleting resources from Cloudinary:', error);
      // We don't want to throw an error here, just log it.
      // The course deletion should not fail if cloudinary deletion fails.
   }
};

export const deleteResource = async (publicId, resourceType) => {
   if (!publicId) {
      return;
   }
   try {
      await cloudinary.uploader.destroy(publicId, {
         resource_type: resourceType,
      });
   } catch (error) {
      console.error('Error deleting resource from Cloudinary:', error);
   }
};
