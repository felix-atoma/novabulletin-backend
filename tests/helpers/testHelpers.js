// tests/helpers/testHelpers.js
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const School = require('../../src/models/School');
const Student = require('../../src/models/Student');
const Class = require('../../src/models/Classroom');
const Subject = require('../../src/models/Subject');
const Teacher = require('../../src/models/Teacher');
const jwt = require('jsonwebtoken');

class TestHelpers {
  static async createUser(userData = {}) {
    const defaultUser = {
      firstName: 'Test',
      lastName: 'User',
      email: `test${Date.now()}@test.com`,
      password: 'Test123!',
      role: 'admin',
      phone: '+22997000000',
      ...userData
    };

    console.log('Creating user with data:', { ...defaultUser, password: '***' });

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(defaultUser);

    console.log('User creation response:', {
      status: response.status,
      body: response.body
    });

    if (response.status !== 201) {
      throw new Error(`User creation failed: ${JSON.stringify(response.body)}`);
    }

    return {
      user: response.body.data.user,
      token: response.body.token
    };
  }

  static async createSchool(token, schoolData = {}) {
    const defaultSchool = {
      name: 'Test School',
      address: '123 Test Street',
      city: 'Lomé',
      country: 'Togo',
      phone: '+22997000001',
      email: 'school@test.com',
      academicYear: '2024-2025',
      type: 'primary',
      status: 'active',
      ...schoolData
    };

    console.log('Creating school with data:', defaultSchool);

    const response = await request(app)
      .post('/api/v1/schools')
      .set('Authorization', `Bearer ${token}`)
      .send(defaultSchool);

    console.log('School creation response:', {
      status: response.status,
      body: response.body
    });

    if (response.status !== 201) {
      // If school endpoint doesn't exist, create school directly in database
      console.log('School API endpoint failed, creating school directly in DB');
      try {
        const school = await this.createSchoolDirect(defaultSchool);
        return school;
      } catch (dbError) {
        throw new Error(`School creation failed - API: ${response.body.message}, DB: ${dbError.message}`);
      }
    }

    // Handle different response structures
    if (response.body.data && response.body.data.school) {
      return response.body.data.school;
    } else if (response.body.data) {
      return response.body.data;
    } else if (response.body.school) {
      return response.body.school;
    } else {
      return response.body;
    }
  }

  static async createSchoolDirect(schoolData = {}) {
    const defaultSchool = {
      name: 'Test School',
      address: '123 Test Street',
      city: 'Lomé',
      country: 'Togo',
      phone: '+22997000001',
      email: 'school@test.com',
      academicYear: '2024-2025',
      type: 'primary',
      status: 'active',
      ...schoolData
    };

    try {
      const school = await School.create(defaultSchool);
      console.log('School created directly in DB:', school._id);
      return school;
    } catch (error) {
      console.log('School creation error details:', error.message);
      
      // Try with minimal required fields
      try {
        console.log('Trying minimal school creation...');
        const minimalSchool = await School.create({
          name: 'Test School',
          city: 'Lomé',
          country: 'Togo',
          phone: '+22997000001',
          email: 'school@test.com'
        });
        console.log('Minimal school created:', minimalSchool._id);
        return minimalSchool;
      } catch (minimalError) {
        throw new Error(`Direct school creation failed: ${error.message}. Minimal also failed: ${minimalError.message}`);
      }
    }
  }

  static async createClass(token, classData = {}) {
    const defaultClass = {
      name: 'Test Class',
      level: 'primaire',
      grade: 'CE1',
      capacity: 40,
      academicYear: '2024-2025',
      ...classData
    };

    console.log('Creating class with data:', defaultClass);

    const response = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${token}`)
      .send(defaultClass);

    console.log('Class creation response:', {
      status: response.status,
      body: response.body
    });

    if (response.status !== 201) {
      // If class endpoint doesn't exist, create class directly in database
      console.log('Class API endpoint failed, creating class directly in DB');
      try {
        const classroom = await this.createClassDirect(defaultClass);
        return classroom;
      } catch (dbError) {
        throw new Error(`Class creation failed - API: ${response.body.message}, DB: ${dbError.message}`);
      }
    }

    // Handle different response structures
    if (response.body.data && response.body.data.class) {
      return response.body.data.class;
    } else if (response.body.data) {
      return response.body.data;
    } else if (response.body.class) {
      return response.body.class;
    } else {
      return response.body;
    }
  }

  static async createClassDirect(classData = {}) {
    const defaultClass = {
      name: 'Test Class',
      level: 'primaire',
      grade: 'CE1',
      capacity: 40,
      academicYear: '2024-2025',
      ...classData
    };

    try {
      const classroom = await Class.create(defaultClass);
      console.log('Class created directly in DB:', classroom._id);
      return classroom;
    } catch (error) {
      throw new Error(`Direct class creation failed: ${error.message}`);
    }
  }

  static async createSubject(token, subjectData = {}) {
    const defaultSubject = {
      name: 'Mathematics',
      code: 'MATH',
      coefficient: 3,
      level: 'primaire',
      ...subjectData
    };

    console.log('Creating subject with data:', defaultSubject);

    const response = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${token}`)
      .send(defaultSubject);

    console.log('Subject creation response:', {
      status: response.status,
      body: response.body
    });

    if (response.status !== 201) {
      // If subject endpoint doesn't exist, create subject directly in database
      console.log('Subject API endpoint failed, creating subject directly in DB');
      try {
        const subject = await this.createSubjectDirect(defaultSubject);
        return subject;
      } catch (dbError) {
        throw new Error(`Subject creation failed - API: ${response.body.message}, DB: ${dbError.message}`);
      }
    }

    // Handle different response structures
    if (response.body.data && response.body.data.subject) {
      return response.body.data.subject;
    } else if (response.body.data) {
      return response.body.data;
    } else if (response.body.subject) {
      return response.body.subject;
    } else {
      return response.body;
    }
  }

  static async createSubjectDirect(subjectData = {}) {
    const defaultSubject = {
      name: 'Mathematics',
      code: 'MATH',
      coefficient: 3,
      level: 'primaire',
      ...subjectData
    };

    try {
      const subject = await Subject.create(defaultSubject);
      console.log('Subject created directly in DB:', subject._id);
      return subject;
    } catch (error) {
      throw new Error(`Direct subject creation failed: ${error.message}`);
    }
  }

  static async createStudent(token, studentData = {}) {
    const defaultStudent = {
      firstName: 'Student',
      lastName: 'Test',
      studentId: `STU${Date.now()}`,
      dateOfBirth: '2015-05-15',
      gender: 'male', // Changed from 'M' to 'male'
      level: 'primaire',
      guardianName: 'Parent Test',
      guardianPhone: '+22997000002',
      guardianEmail: 'parent@test.com',
      ...studentData
    };

    console.log('Creating student with data:', defaultStudent);

    const response = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${token}`)
      .send(defaultStudent);

    console.log('Student creation response:', {
      status: response.status,
      body: response.body
    });

    if (response.status !== 201) {
      // If student endpoint doesn't exist, create student directly in database
      console.log('Student API endpoint failed, creating student directly in DB');
      try {
        const student = await this.createStudentDirect(defaultStudent);
        return student;
      } catch (dbError) {
        throw new Error(`Student creation failed - API: ${response.body.message}, DB: ${dbError.message}`);
      }
    }

    // Handle different response structures
    if (response.body.data && response.body.data.student) {
      return response.body.data.student;
    } else if (response.body.data) {
      return response.body.data;
    } else if (response.body.student) {
      return response.body.student;
    } else {
      return response.body;
    }
  }

  static async createStudentDirect(studentData = {}) {
    const defaultStudent = {
      firstName: 'Student',
      lastName: 'Test',
      studentId: `STU${Date.now()}`,
      dateOfBirth: '2015-05-15',
      gender: 'male', // Changed from 'M' to 'male'
      level: 'primaire',
      guardianName: 'Parent Test',
      guardianPhone: '+22997000002',
      guardianEmail: 'parent@test.com',
      ...studentData
    };

    try {
      const student = await Student.create(defaultStudent);
      console.log('Student created directly in DB:', student._id);
      return student;
    } catch (error) {
      console.log('Student creation error details:', error.message);
      
      // Try with different gender values
      const genderOptions = ['male', 'female', 'homme', 'femme', 'garçon', 'fille', 'm', 'f', 'M', 'F'];
      for (const gender of genderOptions) {
        try {
          console.log(`Trying gender: ${gender}`);
          const studentWithGender = await Student.create({
            ...defaultStudent,
            gender: gender
          });
          console.log(`Student created with gender ${gender}:`, studentWithGender._id);
          return studentWithGender;
        } catch (genderError) {
          console.log(`Gender ${gender} failed:`, genderError.message);
        }
      }
      
      // If all gender options fail, try without gender field
      try {
        console.log('Trying without gender field...');
        const { gender, ...studentWithoutGender } = defaultStudent;
        const student = await Student.create(studentWithoutGender);
        console.log('Student created without gender:', student._id);
        return student;
      } catch (noGenderError) {
        console.log('Student creation without gender failed:', noGenderError.message);
      }
      
      throw new Error(`Direct student creation failed: ${error.message}`);
    }
  }

  static async createTeacher(token, teacherData = {}) {
    const defaultTeacher = {
      firstName: 'Teacher',
      lastName: 'Test',
      teacherId: `TCH${Date.now()}`,
      specialization: 'Mathematics',
      level: 'primaire',
      phone: '+22997000003',
      email: `teacher${Date.now()}@test.com`,
      ...teacherData
    };

    console.log('Creating teacher with data:', defaultTeacher);

    const response = await request(app)
      .post('/api/v1/teachers')
      .set('Authorization', `Bearer ${token}`)
      .send(defaultTeacher);

    console.log('Teacher creation response:', {
      status: response.status,
      body: response.body
    });

    if (response.status !== 201) {
      // If teacher endpoint doesn't exist, create teacher directly in database
      console.log('Teacher API endpoint failed, creating teacher directly in DB');
      try {
        const teacher = await Teacher.create(defaultTeacher);
        return teacher;
      } catch (dbError) {
        throw new Error(`Teacher creation failed - API: ${response.body.message}, DB: ${dbError.message}`);
      }
    }

    // Handle different response structures
    if (response.body.data && response.body.data.teacher) {
      return response.body.data.teacher;
    } else if (response.body.data) {
      return response.body.data;
    } else if (response.body.teacher) {
      return response.body.teacher;
    } else {
      return response.body;
    }
  }

  static async createGrade(token, gradeData = {}) {
    const defaultGrade = {
      studentId: '507f1f77bcf86cd799439011', // Default mock ID
      subjectId: '507f1f77bcf86cd799439012', // Default mock ID
      trimester: 'first',
      note: 15,
      appreciation: 'Good work',
      ...gradeData
    };

    console.log('Creating grade with data:', defaultGrade);

    const response = await request(app)
      .post('/api/v1/grades')
      .set('Authorization', `Bearer ${token}`)
      .send(defaultGrade);

    console.log('Grade creation response:', {
      status: response.status,
      body: response.body
    });

    if (response.status !== 201) {
      throw new Error(`Grade creation failed: ${JSON.stringify(response.body)}`);
    }

    // Handle different response structures
    if (response.body.data && response.body.data.grade) {
      return response.body.data.grade;
    } else if (response.body.data) {
      return response.body.data;
    } else if (response.body.grade) {
      return response.body.grade;
    } else {
      return response.body;
    }
  }

  static async loginUser(credentials) {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(credentials);

    console.log('Login response:', {
      status: response.status,
      body: response.body
    });

    if (response.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(response.body)}`);
    }

    return {
      user: response.body.data.user,
      token: response.body.token
    };
  }

  static generateToken(userId, role = 'admin') {
    const jwtSecret = process.env.JWT_SECRET || 'test-secret';
    return jwt.sign(
      { id: userId, role },
      jwtSecret,
      { expiresIn: '1h' }
    );
  }

  // Mock data generators for testing without database
  static generateMockSchool() {
    return {
      _id: '507f1f77bcf86cd799439011',
      name: 'Mock School',
      city: 'Lomé',
      country: 'Togo'
    };
  }

  static generateMockClass() {
    return {
      _id: '507f1f77bcf86cd799439012',
      name: 'Mock Class',
      level: 'primaire'
    };
  }

  static generateMockStudent() {
    return {
      _id: '507f1f77bcf86cd799439013',
      firstName: 'Mock',
      lastName: 'Student',
      studentId: 'MOCK001'
    };
  }

  static generateMockSubject() {
    return {
      _id: '507f1f77bcf86cd799439014',
      name: 'Mock Subject',
      code: 'MOCK'
    };
  }

  static generateMockGrade() {
    return {
      _id: '507f1f77bcf86cd799439015',
      studentId: '507f1f77bcf86cd799439013',
      subjectId: '507f1f77bcf86cd799439014',
      trimester: 'first',
      note: 15
    };
  }
}

module.exports = TestHelpers;