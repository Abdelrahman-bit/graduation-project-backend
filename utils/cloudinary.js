import { v2 as cloudinary } from 'cloudinary';

// Validate required env vars early for clearer errors
const required = [
   'CLOUDINARY_CLOUD_NAME',
   'CLOUDINARY_API_KEY',
   'CLOUDINARY_API_SECRET',
];
const missing = required.filter(
   (k) => !process.env[k] || String(process.env[k]).trim() === ''
);
if (missing.length) {
   // Helpful message, but do not throw in production boot if app can start without it.
   // Throwing here is okay if Cloudinary is critical.
   // eslint-disable-next-line no-console
   console.warn(
      `Cloudinary configuration missing: ${missing.join(', ')}. ` +
         'Operations that require Cloudinary will fail until these are set.'
   );
}

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
