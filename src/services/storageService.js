const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploadFile = async (filePath, folder = 'novabulletin') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto'
    });
    
    // Supprimer le fichier local après upload
    fs.unlinkSync(filePath);
    
    return result;
  } catch (error) {
    throw new Error(`Erreur upload cloudinary: ${error.message}`);
  }
};

exports.uploadPDF = async (pdfBuffer, fileName, folder = 'bulletins') => {
  try {
    // Sauvegarder temporairement le buffer en fichier
    const tempPath = `/tmp/${fileName}`;
    fs.writeFileSync(tempPath, pdfBuffer);
    
    const result = await cloudinary.uploader.upload(tempPath, {
      folder: folder,
      resource_type: 'raw',
      format: 'pdf'
    });
    
    // Supprimer le fichier temporaire
    fs.unlinkSync(tempPath);
    
    return result.secure_url;
  } catch (error) {
    throw new Error(`Erreur upload PDF: ${error.message}`);
  }
};

exports.deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error(`Erreur suppression fichier: ${error.message}`);
  }
};