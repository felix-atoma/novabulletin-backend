const Grade = require('../models/Grade');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Class = require('../models/Classroom');

/**
 * ENTER A SINGLE GRADE
 */
exports.enterGrade = async (req, res) => {
  try {
    console.log('📝 Entering grade with data:', req.body);
    
    const { studentId, subjectId, trimester, note, appreciation } = req.body;

    if (!studentId || !subjectId || !trimester || note === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'studentId, subjectId, trimester, and note are required'
      });
    }

    // Validate note range
    if (note < 0 || note > 20) {
      return res.status(400).json({
        status: 'error',
        message: 'Note must be between 0 and 20'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Élève non trouvé' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ status: 'error', message: 'Matière non trouvée' });
    }

    // Check if grade already exists for this student/subject/trimester
    const existingGrade = await Grade.findOne({
      student: studentId,
      subject: subjectId,
      trimester
    });

    let grade;
    if (existingGrade) {
      // Update existing grade
      grade = await Grade.findByIdAndUpdate(
        existingGrade._id,
        {
          note: parseFloat(note),
          appreciation: appreciation || '',
          lastModified: new Date(),
          enteredBy: req.user?._id || null
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new grade
      grade = await Grade.create({
        student: studentId,
        subject: subjectId,
        class: student.class,
        trimester,
        academicYear: '2024-2025',
        note: parseFloat(note),
        appreciation: appreciation || '',
        coefficient: subject.coefficient || 1,
        enteredBy: req.user?._id || null
      });
    }

    // Populate the response
    const populatedGrade = await Grade.findById(grade._id)
      .populate('student', 'firstName lastName studentId')
      .populate('subject', 'name code coefficient')
      .populate('class', 'name');

    res.status(201).json({ 
      status: 'success', 
      message: existingGrade ? 'Note mise à jour avec succès' : 'Note créée avec succès',
      data: { grade: populatedGrade } 
    });

  } catch (error) {
    console.error('Enter grade error:', error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * GET GRADES FOR A STUDENT
 */
exports.getStudentGrades = async (req, res) => {
  try {
    const { studentId, trimester } = req.params;

    console.log('📊 Getting grades for student:', studentId, 'trimester:', trimester);

    const grades = await Grade.find({ student: studentId, trimester })
      .populate('subject', 'name code coefficient')
      .populate('class', 'name')
      .sort({ 'subject.name': 1 });

    res.status(200).json({
      status: 'success',
      results: grades.length,
      data: { grades }
    });

  } catch (error) {
    console.error('Get student grades error:', error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * GET GRADES FOR CLASS + SUBJECT
 */
exports.getClassGrades = async (req, res) => {
  try {
    const { classId, subjectId, trimester } = req.params;

    console.log('📊 Getting class grades for:', { classId, subjectId, trimester });

    const students = await Student.find({ class: classId })
      .select('_id firstName lastName studentId')
      .sort('lastName firstName');

    const grades = await Grade.find({
      class: classId,
      subject: subjectId,
      trimester
    }).populate('student', 'firstName lastName studentId');

    const gradesMap = {};
    grades.forEach(g => { 
      if (g.student && g.student._id) {
        gradesMap[g.student._id.toString()] = g; 
      }
    });

    const result = students.map(student => ({
      student,
      grade: gradesMap[student._id.toString()] || null
    }));

    res.status(200).json({
      status: 'success',
      results: result.length,
      data: { grades: result }
    });

  } catch (error) {
    console.error('Get class grades error:', error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * BULK ENTER GRADES
 */
exports.bulkEnterGrades = async (req, res) => {
  try {
    const { classId, subjectId, trimester, grades } = req.body;

    console.log('📝 Bulk entering grades for class:', classId, 'subject:', subjectId, 'count:', grades?.length);

    if (!Array.isArray(grades)) {
      return res.status(400).json({
        status: 'error',
        message: 'grades must be an array'
      });
    }

    if (grades.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'grades array cannot be empty'
      });
    }

    const classObj = await Class.findById(classId);
    if (!classObj) return res.status(404).json({ status: 'error', message: 'Classe non trouvée' });

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ status: 'error', message: 'Matière non trouvée' });

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const gradeData of grades) {
      try {
        const { studentId, note, appreciation } = gradeData;

        if (!studentId || note === undefined) {
          errors.push(`Données manquantes pour studentId: ${studentId}`);
          errorCount++;
          continue;
        }

        // Validate note range
        if (note < 0 || note > 20) {
          errors.push(`Note invalide (${note}) pour studentId: ${studentId}`);
          errorCount++;
          continue;
        }

        const student = await Student.findById(studentId);
        if (!student) {
          errors.push(`Élève non trouvé: ${studentId}`);
          errorCount++;
          continue;
        }

        // Check if grade exists
        const existingGrade = await Grade.findOne({
          student: studentId,
          subject: subjectId,
          trimester
        });

        if (existingGrade) {
          // Update existing grade
          await Grade.findByIdAndUpdate(
            existingGrade._id,
            {
              note: parseFloat(note),
              appreciation: appreciation || '',
              lastModified: new Date(),
              enteredBy: req.user?._id || null
            },
            { new: true, runValidators: true }
          );
        } else {
          // Create new grade
          await Grade.create({
            student: studentId,
            subject: subjectId,
            class: classId,
            trimester,
            academicYear: classObj.academicYear || '2024-2025',
            note: parseFloat(note),
            appreciation: appreciation || '',
            coefficient: subject.coefficient || 1,
            enteredBy: req.user?._id || null
          });
        }

        successCount++;

      } catch (error) {
        errors.push(`Erreur pour studentId ${gradeData.studentId}: ${error.message}`);
        errorCount++;
      }
    }

    res.status(200).json({
      status: 'success',
      message: `${successCount} notes enregistrées avec succès, ${errorCount} échecs`,
      data: {
        successCount,
        errorCount,
        errors: errors.slice(0, 10) // Limit errors in response
      }
    });

  } catch (error) {
    console.error('Bulk enter grades error:', error);
    res.status(400).json({ status: 'error', message: error.message });
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

    if (!grade) {
      return res.status(404).json({ status: 'error', message: 'Note non trouvée' });
    }

    res.status(200).json({ status: 'success', data: { grade } });

  } catch (error) {
    console.error('Get grade error:', error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * UPDATE GRADE
 */
exports.updateGrade = async (req, res) => {
  try {
    const { note, appreciation } = req.body;

    console.log('✏️ Updating grade:', req.params.id, 'with data:', { note, appreciation });

    const updateData = {
      appreciation: appreciation || '',
      lastModified: new Date(),
      enteredBy: req.user?._id || null
    };

    if (note !== undefined) {
      // Validate note range
      if (note < 0 || note > 20) {
        return res.status(400).json({
          status: 'error',
          message: 'Note must be between 0 and 20'
        });
      }
      updateData.note = parseFloat(note);
    }

    const grade = await Grade.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('student', 'firstName lastName studentId')
    .populate('subject', 'name code coefficient');

    if (!grade) {
      return res.status(404).json({ status: 'error', message: 'Note non trouvée' });
    }

    res.status(200).json({ 
      status: 'success', 
      message: 'Note mise à jour avec succès',
      data: { grade } 
    });

  } catch (error) {
    console.error('Update grade error:', error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * DELETE GRADE
 */
exports.deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({ status: 'error', message: 'Note non trouvée' });
    }

    await Grade.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Note supprimée avec succès'
    });

  } catch (error) {
    console.error('Delete grade error:', error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * GET ALL GRADES
 */
exports.getAllGrades = async (req, res) => {
  try {
    const grades = await Grade.find()
      .populate('student', 'firstName lastName studentId')
      .populate('subject', 'name code')
      .populate('class', 'name')
      .sort({ trimester: 1, 'student.lastName': 1 });

    res.status(200).json({
      status: 'success',
      results: grades.length,
      data: { grades }
    });

  } catch (error) {
    console.error('Get all grades error:', error);
    res.status(400).json({ status: 'error', message: error.message });
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
    )
    .populate('student', 'firstName lastName studentId')
    .populate('subject', 'name code');

    if (!grade) {
      return res.status(404).json({ status: 'error', message: 'Note non trouvée' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Note publiée avec succès',
      data: { grade }
    });

  } catch (error) {
    console.error('Publish grade error:', error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * IMPORT GRADES
 */
exports.importGrades = async (req, res) => {
  try {
    const { classId, subjectId, trimester } = req.params;
    const { grades } = req.body;

    console.log('📥 Importing grades for class:', classId, 'count:', grades?.length);

    if (!Array.isArray(grades)) {
      return res.status(400).json({ status: 'error', message: 'grades must be an array' });
    }

    const classObj = await Class.findById(classId);
    if (!classObj) return res.status(404).json({ status: 'error', message: 'Classe non trouvée' });

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ status: 'error', message: 'Matière non trouvée' });

    let imported = 0, failed = 0;
    const errors = [];

    for (const g of grades) {
      try {
        const student = await Student.findOne({ studentId: g.studentId });
        if (!student) {
          errors.push(`Élève ${g.studentId} non trouvé`);
          failed++;
          continue;
        }

        // Validate note range
        if (g.note !== undefined && (g.note < 0 || g.note > 20)) {
          errors.push(`Note invalide (${g.note}) pour ${g.studentId}`);
          failed++;
          continue;
        }

        await Grade.findOneAndUpdate(
          { student: student._id, subject: subjectId, trimester },
          {
            student: student._id,
            subject: subjectId,
            class: classId,
            trimester,
            academicYear: classObj.academicYear || '2024-2025',
            note: g.note ?? null,
            appreciation: g.appreciation || '',
            coefficient: subject.coefficient || 1,
            enteredBy: req.user?._id || null
          },
          { upsert: true, new: true, runValidators: true }
        );

        imported++;

      } catch (err) {
        errors.push(`Erreur pour ${g.studentId}: ${err.message}`);
        failed++;
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Import terminé: ${imported} réussis, ${failed} échecs`,
      data: { imported, failed, errors: errors.slice(0, 10) }
    });

  } catch (error) {
    console.error('Import grades error:', error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * EXPORT GRADES
 */
exports.exportGrades = async (req, res) => {
  try {
    const { classId, subjectId, trimester } = req.params;

    console.log('📤 Exporting grades for class:', classId, 'subject:', subjectId, 'trimester:', trimester);

    const students = await Student.find({ class: classId })
      .select('_id firstName lastName studentId')
      .sort('lastName firstName');

    const grades = await Grade.find({
      class: classId,
      subject: subjectId,
      trimester
    }).populate('student', 'firstName lastName studentId');

    const gradesMap = {};
    grades.forEach(g => { 
      if (g.student && g.student._id) {
        gradesMap[g.student._id.toString()] = g; 
      }
    });

    const exportData = students.map(s => {
      const g = gradesMap[s._id.toString()];
      return {
        studentId: s.studentId,
        lastName: s.lastName,
        firstName: s.firstName,
        note: g?.note || '',
        appreciation: g?.appreciation || '',
        coefficient: g?.coefficient || subject?.coefficient || 1
      };
    });

    res.status(200).json({
      status: 'success',
      results: exportData.length,
      data: { grades: exportData }
    });

  } catch (error) {
    console.error('Export grades error:', error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};