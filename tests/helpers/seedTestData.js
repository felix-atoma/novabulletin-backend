// tests/helpers/seedTestData.js
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const School = require('../../src/models/School');
const Student = require('../../src/models/Student');
const Class = require('../../src/models/Classroom');
const Subject = require('../../src/models/Subject');
const Grade = require('../../src/models/grade');
const Teacher = require('../../src/models/Teacher');
const Parent = require('../../src/models/Parent');

class TestDataSeeder {
  /**
   * Seed complete test environment
   */
  static async seedAll() {
    console.log('🌱 Seeding test data...');

    try {
      // Clean existing data
      await this.cleanAll();

      // Seed in order
      const admin = await this.seedAdmin();
      const school = await this.seedSchool(admin._id);
      const subjects = await this.seedSubjects();
      const teacher = await this.seedTeacher(school._id, subjects.map(s => s._id));
      const classData = await this.seedClass(school._id, teacher._id);
      const students = await this.seedStudents(school._id, classData._id, 10);
      const parent = await this.seedParent(students[0]._id);
      await this.seedGrades(students, subjects, classData._id, teacher._id);

      console.log('✅ Test data seeded successfully!');
      console.log(`   - Admin: admin@test.com / Admin123!`);
      console.log(`   - Teacher: teacher@test.com / Teacher123!`);
      console.log(`   - Parent: parent@test.com / Parent123!`);
      console.log(`   - School: ${school.name}`);
      console.log(`   - Class: ${classData.name}`);
      console.log(`   - Students: ${students.length}`);
      console.log(`   - Subjects: ${subjects.length}`);

      return {
        admin,
        school,
        teacher,
        classData,
        students,
        subjects,
        parent
      };
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  /**
   * Clean all test data
   */
  static async cleanAll() {
    const collections = [
      'users',
      'schools',
      'students',
      'classes',
      'subjects',
      'grades',
      'teachers',
      'parents',
      'bulletins',
      'payments'
    ];

    for (const collection of collections) {
      try {
        await mongoose.connection.collection(collection).deleteMany({});
      } catch (error) {
        // Collection might not exist yet
      }
    }

    console.log('🧹 Cleaned existing data');
  }

  /**
   * Seed admin user
   */
  static async seedAdmin() {
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'System',
      email: 'admin@test.com',
      password: 'Admin123!',
      role: 'admin',
      phone: '+22997000001'
    });

    console.log('👤 Admin created');
    return adminUser;
  }

  /**
   * Seed school
   */
  static async seedSchool(adminId) {
    const school = await School.create({
      name: 'École de Test',
      address: '123 Rue de Test, Cotonou',
      phone: '+22997000002',
      email: 'school@test.com',
      academicYear: '2024-2025',
      type: 'primary',
      director: adminId
    });

    console.log('🏫 School created');
    return school;
  }

  /**
   * Seed subjects
   */
  static async seedSubjects() {
    const subjectsData = [
      { name: 'Mathématiques', code: 'MATH', coefficient: 3, level: 'primaire' },
      { name: 'Français', code: 'FRAN', coefficient: 3, level: 'primaire' },
      { name: 'Sciences', code: 'SCI', coefficient: 2, level: 'primaire' },
      { name: 'Histoire-Géographie', code: 'HIST', coefficient: 2, level: 'primaire' },
      { name: 'Anglais', code: 'ENG', coefficient: 2, level: 'primaire' },
      { name: 'Éducation Physique', code: 'EPS', coefficient: 1, level: 'primaire' }
    ];

    const subjects = await Subject.insertMany(subjectsData);
    console.log(`📚 ${subjects.length} subjects created`);
    return subjects;
  }

  /**
   * Seed teacher
   */
  static async seedTeacher(schoolId, subjectIds) {
    const teacherUser = await User.create({
      firstName: 'Marie',
      lastName: 'Dupont',
      email: 'teacher@test.com',
      password: 'Teacher123!',
      role: 'teacher',
      phone: '+22997000003',
      school: schoolId
    });

    const teacher = await Teacher.create({
      user: teacherUser._id,
      school: schoolId,
      subjects: subjectIds,
      specialization: 'Mathématiques',
      firstName: 'Marie',
      lastName: 'Dupont',
      email: 'teacher@test.com',
      phone: '+22997000003'
    });

    console.log('👨‍🏫 Teacher created');
    return teacher;
  }

  /**
   * Seed class
   */
  static async seedClass(schoolId, teacherId) {
    const classData = await Class.create({
      name: 'CE1 A',
      level: 'primaire',
      grade: 'CE1',
      capacity: 40,
      academicYear: '2024-2025',
      school: schoolId,
      teacher: teacherId
    });

    console.log('🎓 Class created');
    return classData;
  }

  /**
   * Seed students
   */
  static async seedStudents(schoolId, classId, count = 10) {
    const firstNames = ['Jean', 'Marie', 'Pierre', 'Fatima', 'Amadou', 'Aisha', 'Kofi', 'Yaa', 'Kwame', 'Akua'];
    const lastNames = ['Kouassi', 'Diallo', 'Toure', 'Ouattara', 'Kone', 'Traore', 'Bamba', 'Sangare', 'Coulibaly', 'Doumbia'];

    const students = [];

    for (let i = 0; i < count; i++) {
      const student = await Student.create({
        firstName: firstNames[i % firstNames.length],
        lastName: lastNames[i % lastNames.length],
        studentId: `STU2024${String(i + 1).padStart(3, '0')}`,
        dateOfBirth: new Date(2015, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: i % 2 === 0 ? 'M' : 'F',
        class: classId,
        school: schoolId,
        level: 'primaire',
        address: `${i + 1} Avenue Test`,
        guardianName: `Parent ${lastNames[i % lastNames.length]}`,
        guardianPhone: `+2299700000${i + 4}`,
        guardianEmail: `parent${i + 1}@test.com`
      });

      students.push(student);
    }

    console.log(`👨‍🎓 ${students.length} students created`);
    return students;
  }

  /**
   * Seed parent
   */
  static async seedParent(studentId) {
    const parentUser = await User.create({
      firstName: 'Parent',
      lastName: 'Test',
      email: 'parent@test.com',
      password: 'Parent123!',
      role: 'parent',
      phone: '+22997000014'
    });

    const parent = await Parent.create({
      user: parentUser._id,
      firstName: 'Parent',
      lastName: 'Test',
      email: 'parent@test.com',
      phone: '+22997000014',
      children: [{
        student: studentId,
        relationship: 'father'
      }],
      paymentStatus: 'unpaid'
    });

    console.log('👪 Parent created');
    return parent;
  }

  /**
   * Seed grades
   */
  static async seedGrades(students, subjects, classId, teacherId) {
    const trimesters = ['first', 'second', 'third'];
    let gradeCount = 0;

    for (const student of students) {
      for (const subject of subjects) {
        for (const trimester of trimesters) {
          const note = 10 + Math.random() * 10; // Random grade between 10 and 20

          await Grade.create({
            student: student._id,
            subject: subject._id,
            class: classId,
            teacher: teacherId,
            trimester,
            academicYear: '2024-2025',
            scores: {
              note: Math.round(note * 100) / 100,
              appreciation: this.getRandomAppreciation(note)
            },
            coefficient: subject.coefficient,
            enteredBy: teacherId
          });

          gradeCount++;
        }
      }
    }

    console.log(`📊 ${gradeCount} grades created`);
  }

  /**
   * Get random appreciation based on note
   */
  static getRandomAppreciation(note) {
    if (note >= 18) return 'Excellent travail! Continue ainsi.';
    if (note >= 16) return 'Très bon travail.';
    if (note >= 14) return 'Bon travail, continue tes efforts.';
    if (note >= 12) return 'Travail satisfaisant.';
    if (note >= 10) return 'Peut mieux faire.';
    return 'Des efforts supplémentaires sont nécessaires.';
  }

  /**
   * Get seeded data summary
   */
  static async getSummary() {
    const counts = {
      users: await User.countDocuments(),
      schools: await School.countDocuments(),
      students: await Student.countDocuments(),
      classes: await Class.countDocuments(),
      subjects: await Subject.countDocuments(),
      grades: await Grade.countDocuments(),
      teachers: await Teacher.countDocuments(),
      parents: await Parent.countDocuments()
    };

    return counts;
  }
}

module.exports = TestDataSeeder;

// If run directly
if (require.main === module) {
  const mongoose = require('mongoose');
  const dotenv = require('dotenv');

  dotenv.config();

  mongoose.connect(process.env.DATABASE || 'mongodb://127.0.0.1:27017/novabulletin-test')
    .then(async () => {
      console.log('📡 Connected to database');
      await TestDataSeeder.seedAll();
      const summary = await TestDataSeeder.getSummary();
      console.log('\n📊 Database Summary:');
      console.table(summary);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}