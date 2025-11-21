const mongoose = require('mongoose');
const Student = require('../src/models/Student');

async function checkStudentModel() {
  console.log('=== CHECKING STUDENT MODEL REQUIREMENTS ===\n');
  
  // Check the gender enum values
  const genderPath = Student.schema.path('gender');
  if (genderPath && genderPath.enumValues) {
    console.log('✅ Valid gender values:', genderPath.enumValues);
  } else {
    console.log('❌ No gender enum values found');
  }
  
  // Check required fields
  console.log('\n=== STUDENT REQUIRED FIELDS ===');
  const schemaPaths = Student.schema.paths;
  Object.keys(schemaPaths).forEach(path => {
    const pathObj = schemaPaths[path];
    if (pathObj.isRequired) {
      console.log(`📋 REQUIRED: ${path} - ${pathObj.instance}`);
      if (pathObj.enumValues) {
        console.log(`   Valid values: ${pathObj.enumValues}`);
      }
    }
  });
}

checkStudentModel();