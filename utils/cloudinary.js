/**
 * Cloudinary upload helper – images and PDFs (raw).
 * Set CLOUDINARY_URL in env (e.g. cloudinary://API_KEY:API_SECRET@CLOUD_NAME).
 */
const cloudinary = require('cloudinary').v2;
// CLOUDINARY_URL env is read automatically by the SDK

function isConfigured() {
  return !!(process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.startsWith('cloudinary://'));
}

/**
 * Upload image buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer
 * @param {string} mimetype - e.g. image/jpeg
 * @param {string} folder - e.g. pixal/team
 * @returns {Promise<string>} secure_url
 */
async function uploadImage(buffer, mimetype, folder) {
  if (!isConfigured()) throw new Error('CLOUDINARY_URL is not set');
  const b64 = buffer.toString('base64');
  const dataUri = `data:${mimetype};base64,${b64}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image',
  });
  return result.secure_url;
}

/**
 * Upload raw file (e.g. PDF) to Cloudinary.
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - e.g. pixal/blog/pdfs
 * @returns {Promise<string>} secure_url
 */
async function uploadRaw(buffer, folder) {
  if (!isConfigured()) throw new Error('CLOUDINARY_URL is not set');
  const { Readable } = require('stream');
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'raw' },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

module.exports = { isConfigured, uploadImage, uploadRaw };
