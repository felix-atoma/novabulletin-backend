// src/services/pdfGenerator/pdfGenerator.js

const { generateMaternelleBulletin: generateMaternellePDF } = require('./maternellepdf');
const { generatePrimaireBulletin: generatePrimairePDF } = require('./primairepdf');
const { generateCollegeBulletin: generateCollegePDF } = require('./collegepdf');
const { generateLyceeBulletin: generateLyceePDF } = require('./lyceepdf');

/**
 * Generate Maternelle Bulletin PDF
 */
exports.generateMaternelleBulletin = async (bulletinData) => {
  try {
    return await generateMaternellePDF(bulletinData);
  } catch (error) {
    throw new Error(`Erreur génération bulletin maternelle: ${error.message}`);
  }
};

/**
 * Generate Primaire Bulletin PDF
 */
exports.generatePrimaireBulletin = async (bulletinData) => {
  try {
    return await generatePrimairePDF(bulletinData);
  } catch (error) {
    throw new Error(`Erreur génération bulletin primaire: ${error.message}`);
  }
};

/**
 * Generate College Bulletin PDF
 */
exports.generateCollegeBulletin = async (bulletinData) => {
  try {
    return await generateCollegePDF(bulletinData);
  } catch (error) {
    throw new Error(`Erreur génération bulletin collège: ${error.message}`);
  }
};

/**
 * Generate Lycee Bulletin PDF
 */
exports.generateLyceeBulletin = async (bulletinData) => {
  try {
    return await generateLyceePDF(bulletinData);
  } catch (error) {
    throw new Error(`Erreur génération bulletin lycée: ${error.message}`);
  }
};