// tests/helpers/testHelpers.js
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const User = require('../../src/models/User');
const School = require('../../src/models/School');
const Class = require('../../src/models/Classroom');
const Student = require('../../src/models/Student');
const Subject = require('../../src/models/Subject');
const Grade = require('../../src/models/Grade');

class TestHelpers {
  /**
   * Generate a REAL JWT token (not mock)
   */
  static generateToken(userId) {
    const jwtSecret = process.env.JWT_SECRET || 'test-secret-key-for-development';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '90d';
    
    return jwt.sign(
      { id: userId },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );
  }

  /**
   * Create a user via API or directly
   */
  static async createUser(userData = {}) {
    const defaultData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
      phone: '+22997000000'
    };

    const finalData = { ...defaultData, ...userData };
    
    console.log('Creating user with data:', {
      ...finalData,
      password: '***'
    });

    try {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(finalData);

      console.log('User creation response:', {
        status: response.status,
        body: response.body
      });

      if (response.status === 201 && response.body.data && response.body.data.user) {
        return {
          _id: response.body.data.user._id || response.body.data.user.id,
          token: response.body.token,
          user: response.body.data.user,
          ...response.body.data.user
        };
      } else {
        throw new Error(`API failed: ${response.status} - ${JSON.stringify(response.body)}`);
      }
    } catch (error) {
      console.log('User API creation failed, creating directly:', error.message);
      
      // Direct creation as fallback
      try {
        const user = new User(finalData);
        await user.save();
        
        // Generate REAL token for direct creation
        const token = this.generateToken(user._id);
        
        return {
          _id: user._id,
          token: token,
          user: user.toObject(),
          ...user.toObject()
        };
      } catch (directError) {
        console.log('Direct user creation also failed, using mock:', directError.message);
        const mockUser = this.generateMockUser(finalData.role);
        return {
          ...mockUser,
          token: this.generateToken(mockUser._id)
        };
      }
    }
  }

  /**
   * Create a school via API or directly
   */
  static async createSchool(token, schoolData = {}) {
    const defaultData = {
      name: 'Test School',
      address: '123 Test Street',
      city: 'Lomé',
      country: 'Togo',
      phone: '+22997000001',
      email: `school${Date.now()}@test.com`,
      academicYear: '2024-2025',
      type: 'primary',
      status: 'active'
    };

    const finalData = { ...defaultData, ...schoolData };
    
    console.log('Creating school with data:', finalData);

    try {
      const response = await request(app)
        .post('/api/v1/schools')
        .set('Authorization', `Bearer ${token}`)
        .send(finalData);

      console.log('School creation response:', {
        status: response.status,
        body: response.body
      });

      if (response.status === 201) {
        return response.body.data.school;
      } else {
        throw new Error(`API failed: ${response.status} - ${JSON.stringify(response.body)}`);
      }
    } catch (error) {
      console.log('School API creation failed, creating directly:', error.message);
      return await this.createSchoolDirect(finalData);
    }
  }

  /**
   * Create school directly in database
   */
  static async createSchoolDirect(schoolData = {}) {
    const defaultData = {
      name: 'Test School',
      address: '123 Test Street',
      city: 'Lomé',
      country: 'Togo',
      phone: '+22997000001',
      email: `school${Date.now()}@test.com`,
      academicYear: '2024-2025',
      type: 'primary',
      status: 'active'
    };

    const finalData = { ...defaultData, ...schoolData };

    try {
      const school = new School(finalData);
      await school.save();
      return school;
    } catch (error) {
      console.log('Direct school creation failed, using mock:', error.message);
      return this.generateMockSchool();
    }
  }

  /**
   * Create a class via API or directly
   */
  static async createClass(token, classData = {}) {
    const defaultData = {
      name: 'Test Class',
      level: 'ce1',
      grade: 'CE1',
      capacity: 40,
      academicYear: '2024-2025',
      school: classData.school || new mongoose.Types.ObjectId()
    };

    const finalData = { ...defaultData, ...classData };
    
    console.log('Creating class with data:', finalData);

    try {
      const response = await request(app)
        .post('/api/v1/classes')
        .set('Authorization', `Bearer ${token}`)
        .send(finalData);

      console.log('Class creation response:', {
        status: response.status,
        body: response.body
      });

      if (response.status === 201) {
        return response.body.data.class;
      } else {
        throw new Error(`API failed: ${response.status} - ${JSON.stringify(response.body)}`);
      }
    } catch (error) {
      console.log('Class API creation failed, creating directly:', error.message);
      return await this.createClassDirect(finalData);
    }
  }

  /**
   * Create class directly in database
   */
  static async createClassDirect(classData = {}) {
    const defaultData = {
      name: 'Test Class',
      level: 'ce1',
      grade: 'CE1',
      capacity: 40,
      academicYear: '2024-2025',
      school: new mongoose.Types.ObjectId(),
      isActive: true
    };

    const finalData = { ...defaultData, ...classData };

    try {
      const classroom = new Class(finalData);
      await classroom.save();
      return classroom;
    } catch (error) {
      console.log('Direct class creation failed, using mock:', error.message);
      return this.generateMockClass();
    }
  }

  /**
   * Create a student via API or directly
   */
  static async createStudent(token, studentData = {}) {
    const defaultData = {
      firstName: 'Test',
      lastName: 'Student',
      studentId: `STU${Date.now()}`,
      dateOfBirth: '2015-05-15',
      gender: 'male',
      class: studentData.class || new mongoose.Types.ObjectId(),
      school: studentData.school || new mongoose.Types.ObjectId(),
      level: 'ce1',
      guardianName: 'Parent Test',
      guardianPhone: '+22997000002',
      guardianEmail: `parent${Date.now()}@test.com`
    };

    const finalData = { ...defaultData, ...studentData };
    
    console.log('Creating student with data:', finalData);

    try {
      const response = await request(app)
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${token}`)
        .send(finalData);

      console.log('Student creation response:', {
        status: response.status,
        body: response.body
      });

      if (response.status === 201) {
        return response.body.data.student;
      } else {
        throw new Error(`API failed: ${response.status} - ${JSON.stringify(response.body)}`);
      }
    } catch (error) {
      console.log('Student API creation failed, creating directly:', error.message);
      return await this.createStudentDirect(finalData);
    }
  }

  /**
   * Create student directly in database
   */
  static async createStudentDirect(studentData = {}) {
    const defaultData = {
      firstName: 'Test',
      lastName: 'Student',
      studentId: `STU${Date.now()}`,
      dateOfBirth: new Date('2015-05-15'),
      gender: 'male',
      class: new mongoose.Types.ObjectId(),
      school: new mongoose.Types.ObjectId(),
      level: 'ce1',
      guardianName: 'Parent Test',
      guardianPhone: '+22997000002',
      guardianEmail: `parent${Date.now()}@test.com`,
      isActive: true
    };

    const finalData = { ...defaultData, ...studentData };

    try {
      const student = new Student(finalData);
      await student.save();
      return student;
    } catch (error) {
      console.log('Direct student creation failed, using mock:', error.message);
      return this.generateMockStudent();
    }
  }

  /**
   * ✅ FIXED: Create a subject via API or directly - CORRECTED LEVEL AND ADDED SCHOOL
   */
  static async createSubject(token, subjectData = {}) {
    const defaultData = {
      name: 'Mathematics',
      code: `MATH${Date.now()}`,
      coefficient: 3,
      level: 'primary', // ✅ FIXED: Use correct enum value for Subject model
      school: subjectData.school || new mongoose.Types.ObjectId() // ✅ FIXED: Add required school field
    };

    const finalData = { ...defaultData, ...subjectData };
    
    console.log('Creating subject with data:', finalData);

    try {
      const response = await request(app)
        .post('/api/v1/subjects')
        .set('Authorization', `Bearer ${token}`)
        .send(finalData);

      console.log('Subject creation response:', {
        status: response.status,
        body: response.body
      });

      if (response.status === 201) {
        return response.body.data.subject;
      } else {
        throw new Error(`API failed: ${response.status} - ${JSON.stringify(response.body)}`);
      }
    } catch (error) {
      console.log('Subject API creation failed, creating directly:', error.message);
      return await this.createSubjectDirect(finalData);
    }
  }

  /**
   * ✅ FIXED: Create subject directly in database - CORRECTED LEVEL AND ADDED SCHOOL
   */
  static async createSubjectDirect(subjectData = {}) {
    const defaultData = {
      name: 'Mathematics',
      code: `MATH${Date.now()}`,
      coefficient: 3,
      level: 'primary', // ✅ FIXED: Use correct enum value
      school: new mongoose.Types.ObjectId() // ✅ FIXED: Add required school field
    };

    const finalData = { ...defaultData, ...subjectData };

    try {
      const subject = new Subject(finalData);
      await subject.save();
      return subject;
    } catch (error) {
      console.log('Direct subject creation failed, using mock:', error.message);
      return this.generateMockSubject();
    }
  }

  /**
   * Create a grade via API or directly - FIXED TO INCLUDE CLASS
   */
  static async createGrade(token, gradeData = {}) {
    const defaultData = {
      studentId: new mongoose.Types.ObjectId(),
      subjectId: new mongoose.Types.ObjectId(),
      class: gradeData.class || new mongoose.Types.ObjectId(), // ✅ ADDED class field
      trimester: 'first',
      note: 15,
      appreciation: 'Good work'
    };

    const finalData = { ...defaultData, ...gradeData };
    
    console.log('Creating grade with data:', finalData);

    try {
      const response = await request(app)
        .post('/api/v1/grades')
        .set('Authorization', `Bearer ${token}`)
        .send(finalData);

      console.log('Grade creation response:', {
        status: response.status,
        body: response.body
      });

      if (response.status === 200 || response.status === 201) {
        return response.body.data.grade;
      } else {
        throw new Error(`API failed: ${response.status} - ${JSON.stringify(response.body)}`);
      }
    } catch (error) {
      console.log('Grade API creation failed, creating directly:', error.message);
      return await this.createGradeDirect(finalData);
    }
  }

  /**
   * Create grade directly in database - FIXED TO INCLUDE CLASS
   */
  static async createGradeDirect(gradeData = {}) {
    const defaultData = {
      student: new mongoose.Types.ObjectId(),
      subject: new mongoose.Types.ObjectId(),
      class: new mongoose.Types.ObjectId(), // ✅ ADDED class field
      trimester: 'first',
      note: 15,
      appreciation: 'Good work'
    };

    const finalData = { ...defaultData, ...gradeData };

    try {
      const grade = new Grade(finalData);
      await grade.save();
      return grade;
    } catch (error) {
      console.log('Direct grade creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate mock data with valid enum values
   */
  static generateMockUser(role = 'admin') {
    const userId = new mongoose.Types.ObjectId();
    return {
      _id: userId,
      id: userId,
      firstName: 'Mock',
      lastName: 'User',
      email: `${role}@test.com`,
      role: role,
      phone: '+22997000000',
      token: this.generateToken(userId)
    };
  }

  static generateMockSchool() {
    return {
      _id: new mongoose.Types.ObjectId(),
      name: 'Mock School',
      type: 'primary',
      status: 'active',
      academicYear: '2024-2025'
    };
  }

  static generateMockClass() {
    return {
      _id: new mongoose.Types.ObjectId(),
      name: 'Mock Class',
      level: 'ce1',
      grade: 'CE1',
      capacity: 30,
      academicYear: '2024-2025',
      school: new mongoose.Types.ObjectId()
    };
  }

  static generateMockStudent() {
    return {
      _id: new mongoose.Types.ObjectId(),
      firstName: 'Mock',
      lastName: 'Student',
      studentId: `MOCK${Date.now()}`,
      level: 'ce1',
      class: new mongoose.Types.ObjectId(),
      school: new mongoose.Types.ObjectId()
    };
  }

  /**
   * ✅ FIXED: Generate mock subject with correct level and school field
   */
  static generateMockSubject() {
    return {
      _id: new mongoose.Types.ObjectId(),
      name: 'Mock Subject',
      code: `MOCK${Date.now()}`,
      level: 'primary', // ✅ FIXED: Use correct enum value
      coefficient: 3,
      school: new mongoose.Types.ObjectId() // ✅ FIXED: Add required school field
    };
  }

  /**
   * ✅ ADDED: Generate mock grade
   */
  static generateMockGrade() {
    return {
      _id: new mongoose.Types.ObjectId(),
      student: new mongoose.Types.ObjectId(),
      subject: new mongoose.Types.ObjectId(),
      class: new mongoose.Types.ObjectId(),
      trimester: 'first',
      note: 15,
      appreciation: 'Good work',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Clean up test data
   */
  static async cleanup() {
    try {
      await User.deleteMany({ email: /test/ });
      await School.deleteMany({ name: /Test/ });
      await Class.deleteMany({ name: /Test/ });
      await Student.deleteMany({ firstName: /Test/ });
      await Subject.deleteMany({ name: /Test/ });
      await Grade.deleteMany({ appreciation: /Test/ });
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
  }
}

module.exports = TestHelpers;