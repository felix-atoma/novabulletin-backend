const Joi = require('joi');

exports.validateEmail = (email) => {
  const schema = Joi.string().email().required();
  return schema.validate(email);
};

exports.validatePassword = (password) => {
  const schema = Joi.string().min(6).required();
  return schema.validate(password);
};

exports.validatePhone = (phone) => {
  const schema = Joi.string().pattern(/^(\+228|00228)?[0-9]{8}$/);
  return schema.validate(phone);
};

exports.validateStudentId = (studentId) => {
  const schema = Joi.string().pattern(/^[A-Z0-9]{6,12}$/);
  return schema.validate(studentId);
};

exports.validateGrade = (grade) => {
  const schema = Joi.number().min(0).max(20).precision(2);
  return schema.validate(grade);
};

exports.validateCoefficient = (coef) => {
  const schema = Joi.number().min(1).max(10).integer();
  return schema.validate(coef);
};

exports.validateAcademicYear = (year) => {
  const schema = Joi.string().pattern(/^\d{4}-\d{4}$/);
  return schema.validate(year);
};

exports.validateTogoleseName = (name) => {
  const schema = Joi.string().min(2).max(50).pattern(/^[a-zA-ZÀ-ÿ\s\-']+$/);
  return schema.validate(name);
};