const { Storage } = require('@google-cloud/storage');
const path = require('path');

let storage;

const configureCloudStorage = () => {
  try {
    // Initialize Google Cloud Storage
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename: process.env.GCS_KEY_FILE || path.join(__dirname, '../config/gcs-key.json'),
      // Alternative: use credentials object directly
      // credentials: {
      //   client_email: process.env.GCS_CLIENT_EMAIL,
      //   private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n')
      // }
    });

    console.log('Google Cloud Storage configuré avec succès');
  } catch (error) {
    console.error('Erreur de configuration Google Cloud Storage:', error);
  }
};

const getStorage = () => {
  if (!storage) {
    throw new Error('Cloud Storage non configuré. Appelez configureCloudStorage() d\'abord.');
  }
  return storage;
};

const uploadFile = async (file, destination) => {
  try {
    const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
    const blob = bucket.file(destination);

    const stream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (err) => reject(err));
      stream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${destination}`;
        resolve(publicUrl);
      });
      stream.end(file.buffer);
    });
  } catch (error) {
    throw new Error(`Erreur lors de l'upload: ${error.message}`);
  }
};

const deleteFile = async (filePath) => {
  try {
    const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
    await bucket.file(filePath).delete();
    console.log(`Fichier ${filePath} supprimé avec succès`);
  } catch (error) {
    throw new Error(`Erreur lors de la suppression: ${error.message}`);
  }
};

const getSignedUrl = async (filePath, expiresIn = 3600) => {
  try {
    const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
    const file = bucket.file(filePath);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresIn * 1000, // Convert to milliseconds
    });

    return url;
  } catch (error) {
    throw new Error(`Erreur lors de la génération de l'URL signée: ${error.message}`);
  }
};

module.exports = {
  configureCloudStorage,
  getStorage,
  uploadFile,
  deleteFile,
  getSignedUrl
};