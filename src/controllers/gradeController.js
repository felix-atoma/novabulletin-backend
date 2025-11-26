const Grade = require('../models/Grade');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Class = require('../models/Classroom');

/**
 * Utility function: compute moyenne
 */
function computeMoyenne(interrogation1, interrogation2, interrogation3, composition) {
  const notes = [];
  if (interrogation1 != null) notes.push(parseFloat(interrogation1));
  if (interrogation2 != null) notes.push(parseFloat(interrogation2));
  if (interrogation3 != null) notes.push(parseFloat(interrogation3));
  if (composition != null) notes.push(parseFloat(composition) * 2);

  if (notes.length < 3) return null;

  const divisor = interrogation3 != null ? 4 : 3;
  const sum = notes.reduce((a, b) => a + b, 0);
  return parseFloat((sum / divisor).toFixed(2));
}

/**
 * ENTER A SINGLE GRADE (FOR INTERNAL USE)
 */
async function createOrUpdateSingleGrade(reqBody, userId) {
  const {
    studentId,
    subjectId,
    trimester,
    interrogation1,
    interrogation2,
    interrogation3,
    composition,
    appreciation
  } = reqBody;

  if (!studentId || !subjectId || !trimester) {
    throw new Error('studentId, subjectId, and trimester are required');
  }

  const student = await Student.findById(studentId).populate('class');
  if (!student) throw new Error('Élève non trouvé');

  const subject = await Subject.findById(subjectId);
  if (!subject) throw new Error('Matière non trouvée');

  // Compute moyenne
  const moyenne = computeMoyenne(interrogation1, interrogation2, interrogation3, composition);

  const existingGrade = await Grade.findOne({ student: studentId, subject: subjectId, trimester });

  const gradeData = {
    interrogation1: interrogation1 != null ? parseFloat(interrogation1) : null,
    interrogation2: interrogation2 != null ? parseFloat(interrogation2) : null,
    interrogation3: interrogation3 != null ? parseFloat(interrogation3) : null,
    composition: composition != null ? parseFloat(composition) : null,
    note: moyenne,
    appreciation: appreciation || '',
    coefficient: subject.coefficient || 1,
    lastModified: new Date(),
    enteredBy: userId || null,
  };

  let grade;

  if (existingGrade) {
    grade = await Grade.findByIdAndUpdate(existingGrade._id, gradeData, {
      new: true,
      runValidators: true
    });
  } else {
    grade = await Grade.create({
      ...gradeData,
      student: studentId,
      subject: subjectId,
      class: student.class._id,
      trimester,
      academicYear: student.class.academicYear || '2024-2025'
    });
  }

  const populated = await Grade.findById(grade._id)
    .populate('student', 'firstName lastName studentId')
    .populate('subject', 'name code coefficient')
    .populate('class', 'name');

  return {
    updated: !!existingGrade,
    grade: populated
  };
}

/**
 * PUBLIC CONTROLLER: ENTER ONE GRADE
 */
exports.enterGrade = async (req, res) => {
  try {
    const result = await createOrUpdateSingleGrade(req.body, req.user?._id);

    return res.status(201).json({
      status: 'success',
      message: result.updated ? 'Note mise à jour avec succès' : 'Note créée avec succès',
      data: { grade: result.grade }
    });

  } catch (error) {
    console.error('Enter grade error:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * BULK ENTER GRADES (FIXED!!!)
 */
exports.bulkEnterGrades = async (req, res) => {
  try {
    const { classId, subjectId, trimester, grades } = req.body;

    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ status: 'error', message: 'grades must be a non-empty array' });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const g of grades) {
      try {
        await createOrUpdateSingleGrade(
          {
            ...g,
            subjectId,
            trimester,
            classId
          },
          req.user?._id
        );
        successCount++;

      } catch (err) {
        errorCount++;
        errors.push({ studentId: g.studentId, error: err.message });
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `${successCount} notes enregistrées, ${errorCount} échecs`,
      errors
    });

  } catch (error) {
    console.error('Bulk enter grades error:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * GET STUDENT GRADES
 */
exports.getStudentGrades = async (req, res) => {
  try {
    const { studentId, trimester } = req.params;

    const grades = await Grade.find({ student: studentId, trimester })
      .populate('subject', 'name code coefficient')
      .populate('class', 'name');

    return res.status(200).json({
      status: 'success',
      results: grades.length,
      data: { grades }
    });

  } catch (error) {
    console.error('Get student grades error:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * GET CLASS GRADES
 */
exports.getClassGrades = async (req, res) => {
  try {
    const { classId, subjectId, trimester } = req.params;

    const grades = await Grade.find({ class: classId, subject: subjectId, trimester })
      .populate('student', 'firstName lastName studentId');

    return res.status(200).json({
      status: 'success',
      results: grades.length,
      data: { grades }
    });

  } catch (error) {
    console.error('Get class grades error:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * GET SINGLE GRADE
 */
exports.getGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('student', 'firstName lastName studentId')
      .populate('subject', 'name code coefficient')
      .populate('class', 'name');

    if (!grade)
      return res.status(404).json({ status: 'error', message: 'Note non trouvée' });

    return res.status(200).json({ status: 'success', data: { grade } });

  } catch (error) {
    console.error('Get grade error:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * UPDATE GRADE
 */
exports.updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!grade)
      return res.status(404).json({ status: 'error', message: 'Note non trouvée' });

    return res.status(200).json({ status: 'success', data: { grade } });

  } catch (error) {
    console.error('Update grade error:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * DELETE GRADE
 */
exports.deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);

    if (!grade)
      return res.status(404).json({ status: 'error', message: 'Note non trouvée' });

    return res.status(200).json({ status: 'success', message: 'Note supprimée avec succès' });

  } catch (error) {
    console.error('Delete grade error:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * PUBLISH GRADE
 */
exports.publishGrade = async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(
      req.params.id,
      {
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: req.user?._id || null
      },
      { new: true, runValidators: true }
    );

    if (!grade)
      return res.status(404).json({ status: 'error', message: 'Note non trouvée' });

    return res.status(200).json({
      status: 'success',
      message: 'Note publiée',
      data: { grade }
    });

  } catch (error) {
    console.error('Publish grade error:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * PLACEHOLDERS
 */
exports.exportGrades = (req, res) => {
  return res.status(200).json({ status: 'success', message: 'Export grades placeholder' });
};

exports.importGrades = (req, res) => {
  return res.status(200).json({ status: 'success', message: 'Import grades placeholder' });
};

/**
 * GET ALL GRADES
 */
exports.getAllGrades = async (req, res) => {
  try {
    const grades = await Grade.find()
      .populate('student', 'firstName lastName studentId')
      .populate('subject', 'name code')
      .populate('class', 'name');

    return res.status(200).json({
      status: 'success',
      results: grades.length,
      data: { grades }
    });

  } catch (error) {
    console.error('Get all grades error:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};
