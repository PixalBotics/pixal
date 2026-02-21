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

/**
 * Check if a URL is from Cloudinary (res.cloudinary.com).
 * @param {string} url
 * @returns {boolean}
 */
function isCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('res.cloudinary.com');
}

/**
 * Extract public_id from a Cloudinary secure_url for use with destroy().
 * Handles: /image/upload/v123/folder/file.jpg or /raw/upload/v123/folder/file.pdf
 * @param {string} url - secure_url from Cloudinary
 * @returns {{ publicId: string, publicIdWithExt: string, resourceType: 'image' | 'raw' } | null}
 */
function getPublicIdFromUrl(url) {
  if (!isCloudinaryUrl(url)) return null;
  try {
    const u = new URL(url);
    const segments = u.pathname.split('/').filter(Boolean); // ['cloudName','raw','upload','v123', 'pixal','blog','pdfs','file']
    const uploadIdx = segments.indexOf('upload');
    if (uploadIdx === -1 || uploadIdx + 2 >= segments.length) return null;
    const resourceType = segments[uploadIdx - 1] === 'raw' ? 'raw' : 'image';
    // After 'upload' comes version (v123 or v123,f_auto), then folder/file path
    const pathParts = segments.slice(uploadIdx + 2);
    const withExt = pathParts.join('/');
    const publicId = withExt.replace(/\.[^.]+$/, ''); // without extension (for images)
    if (!publicId) return null;
    return { publicId, publicIdWithExt: withExt, resourceType };
  } catch {
    return null;
  }
}

/**
 * Delete an asset from Cloudinary by its secure_url (e.g. from DB).
 * No-op if CLOUDINARY_URL is not set or url is not a Cloudinary URL.
 * @param {string} url - secure_url stored in DB
 * @returns {Promise<void>}
 */
async function deleteByUrl(url) {
  if (!isConfigured() || !isCloudinaryUrl(url)) return;
  const parsed = getPublicIdFromUrl(url);
  if (!parsed) {
    console.warn('[Cloudinary] Could not parse public_id from URL:', url);
    return;
  }
  const { publicId, publicIdWithExt, resourceType } = parsed;
  const options = { resource_type: resourceType, invalidate: true };
  let idToUse = resourceType === 'raw' ? publicIdWithExt : publicId;
  // Raw/PDF: upload_stream often stores public_id WITHOUT extension; try without first, then with
  if (resourceType === 'raw') {
    idToUse = publicId; // try without extension first (e.g. pixal/blog/pdfs/yggtudxqsekt3hrmrz9q)
  }
  console.log('[Cloudinary] Deleting:', { idToUse, resourceType });
  try {
    let result = await cloudinary.uploader.destroy(idToUse, options);
    if (resourceType === 'raw' && result.result === 'not found' && publicIdWithExt !== publicId) {
      result = await cloudinary.uploader.destroy(publicIdWithExt, options);
      console.log('[Cloudinary] Destroy result (with ext):', result.result, resourceType);
    } else {
      console.log('[Cloudinary] Destroy result:', result.result, resourceType);
    }
    if (result.result !== 'ok' && result.result !== 'not found') {
      console.warn('[Cloudinary] destroy result:', result);
    }
  } catch (err) {
    console.error('[Cloudinary] deleteByUrl failed:', { publicId: idToUse, resourceType, message: err.message });
  }
}

module.exports = { isConfigured, uploadImage, uploadRaw, deleteByUrl, isCloudinaryUrl };
