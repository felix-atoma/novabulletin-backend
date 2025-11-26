const Bulletin = require('../models/Bulletin');
const Student = require('../models/Student');
const Grade = require('../models/Grade');

// Generate bulletin with new grading system
exports.generateBulletin = async (req, res) => {
  try {
    const { studentId, trimester, academicYear = '2024-2025' } = req.body;

    console.log('Generating bulletin for student:', studentId, 'trimester:', trimester);

    const student = await Student.findById(studentId)
      .populate('class', 'name grade level series')
      .populate('school', 'name');

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Élève non trouvé'
      });
    }

    // Get grades for the student and trimester
    const grades = await Grade.find({
      student: studentId,
      trimester: trimester
    }).populate('subject', 'name code coefficient');

    console.log(`Found ${grades.length} grades for student ${studentId}`);

    if (grades.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Aucune note trouvée pour cet élève et ce trimestre'
      });
    }

    // Calculate statistics with new grading system
    let totalNotes = 0;
    let totalCoefficients = 0;
    let completedSubjects = 0;
    
    const gradeDetails = grades.map(grade => {
      const moyenne = grade.note || 0;
      const coefficient = grade.coefficient || grade.subject?.coefficient || 1;
      
      if (grade.note !== null && grade.note !== undefined) {
        totalNotes += moyenne * coefficient;
        totalCoefficients += coefficient;
        completedSubjects++;
      }

      return {
        subject: grade.subject ? {
          _id: grade.subject._id,
          name: grade.subject.name,
          code: grade.subject.code,
          coefficient: grade.subject.coefficient
        } : { name: 'Matière inconnue', coefficient: 1 },
        interrogation1: grade.interrogation1,
        interrogation2: grade.interrogation2,
        interrogation3: grade.interrogation3,
        composition: grade.composition,
        moyenne: moyenne,
        coefficient: coefficient,
        appreciation: grade.appreciation || 'Non spécifié'
      };
    });

    const generalAverage = totalCoefficients > 0 
      ? parseFloat((totalNotes / totalCoefficients).toFixed(2)) 
      : 0;

    // Determine mention based on average
    let mention = '';
    if (generalAverage >= 16) mention = 'Très Bien';
    else if (generalAverage >= 14) mention = 'Bien';
    else if (generalAverage >= 12) mention = 'Assez Bien';
    else if (generalAverage >= 10) mention = 'Passable';
    else mention = 'Échec';

    const statistics = {
      average: generalAverage,
      totalSubjects: grades.length,
      completedSubjects: completedSubjects,
      totalCoefficients: totalCoefficients,
      mention: mention
    };

    // Create bulletin
    const bulletinData = {
      student: studentId,
      class: student.class?._id || null,
      trimester: trimester,
      academicYear: academicYear,
      grades: gradeDetails,
      statistics: statistics,
      generalAppreciation: req.body.generalAppreciation || `Moyenne générale: ${generalAverage}/20 - ${mention}`,
      isPublished: false,
      publishedAt: null
    };

    // Check if bulletin already exists
    const existingBulletin = await Bulletin.findOne({
      student: studentId,
      trimester: trimester,
      academicYear: academicYear
    });

    let bulletin;
    if (existingBulletin) {
      bulletin = await Bulletin.findByIdAndUpdate(
        existingBulletin._id,
        bulletinData,
        { new: true, runValidators: true }
      );
    } else {
      bulletin = await Bulletin.create(bulletinData);
    }

    // Populate the response
    const populatedBulletin = await Bulletin.findById(bulletin._id)
      .populate('student', 'firstName lastName studentId')
      .populate('class', 'name grade level series');

    res.status(201).json({
      status: 'success',
      message: existingBulletin ? 'Bulletin mis à jour avec succès' : 'Bulletin généré avec succès',
      data: {
        bulletin: populatedBulletin
      }
    });
  } catch (error) {
    console.error('Bulletin generation error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Generate bulk bulletins for a class
exports.generateBulkBulletins = async (req, res) => {
  try {
    const { classId, trimester, academicYear = '2024-2025' } = req.body;

    console.log('Generating bulk bulletins for class:', classId, 'trimester:', trimester);

    const students = await Student.find({ class: classId })
      .populate('class', 'name grade level series');

    if (students.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Aucun élève trouvé dans cette classe'
      });
    }

    let generated = 0;
    let updated = 0;
    let failed = 0;
    const errors = [];

    for (const student of students) {
      try {
        // Get grades for this student
        const grades = await Grade.find({
          student: student._id,
          trimester: trimester
        }).populate('subject', 'name code coefficient');

        if (grades.length === 0) {
          errors.push(`Aucune note pour ${student.firstName} ${student.lastName}`);
          failed++;
          continue;
        }

        // Calculate statistics
        let totalNotes = 0;
        let totalCoefficients = 0;
        let completedSubjects = 0;
        
        const gradeDetails = grades.map(grade => {
          const moyenne = grade.note || 0;
          const coefficient = grade.coefficient || grade.subject?.coefficient || 1;
          
          if (grade.note !== null && grade.note !== undefined) {
            totalNotes += moyenne * coefficient;
            totalCoefficients += coefficient;
            completedSubjects++;
          }

          return {
            subject: grade.subject ? {
              _id: grade.subject._id,
              name: grade.subject.name,
              code: grade.subject.code,
              coefficient: grade.subject.coefficient
            } : { name: 'Matière inconnue', coefficient: 1 },
            interrogation1: grade.interrogation1,
            interrogation2: grade.interrogation2,
            interrogation3: grade.interrogation3,
            composition: grade.composition,
            moyenne: moyenne,
            coefficient: coefficient,
            appreciation: grade.appreciation || 'Non spécifié'
          };
        });

        const generalAverage = totalCoefficients > 0 
          ? parseFloat((totalNotes / totalCoefficients).toFixed(2)) 
          : 0;

        let mention = '';
        if (generalAverage >= 16) mention = 'Très Bien';
        else if (generalAverage >= 14) mention = 'Bien';
        else if (generalAverage >= 12) mention = 'Assez Bien';
        else if (generalAverage >= 10) mention = 'Passable';
        else mention = 'Échec';

        const statistics = {
          average: generalAverage,
          totalSubjects: grades.length,
          completedSubjects: completedSubjects,
          totalCoefficients: totalCoefficients,
          mention: mention
        };

        // Check if bulletin already exists
        const existingBulletin = await Bulletin.findOne({
          student: student._id,
          trimester: trimester,
          academicYear: academicYear
        });

        const bulletinData = {
          student: student._id,
          class: classId,
          trimester: trimester,
          academicYear: academicYear,
          grades: gradeDetails,
          statistics: statistics,
          generalAppreciation: `Moyenne générale: ${generalAverage}/20 - ${mention}`,
          isPublished: false
        };

        if (existingBulletin) {
          await Bulletin.findByIdAndUpdate(existingBulletin._id, bulletinData);
          updated++;
        } else {
          await Bulletin.create(bulletinData);
          generated++;
        }
        
      } catch (err) {
        errors.push(`Erreur pour ${student.firstName} ${student.lastName}: ${err.message}`);
        failed++;
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Génération terminée: ${generated} nouveaux bulletins, ${updated} mis à jour, ${failed} échecs`,
      data: {
        generated,
        updated,
        failed,
        total: students.length,
        errors: errors.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Bulk bulletin generation error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Download bulletin as PDF
exports.downloadBulletinPDF = async (req, res) => {
  try {
    const bulletin = await Bulletin.findById(req.params.id)
      .populate('student', 'firstName lastName studentId dateOfBirth')
      .populate('class', 'name grade level series')
      .populate('school', 'name address');

    if (!bulletin) {
      return res.status(404).json({
        status: 'error',
        message: 'Bulletin non trouvé'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Bulletin prêt pour téléchargement',
      data: {
        bulletin: {
          _id: bulletin._id,
          student: bulletin.student,
          class: bulletin.class,
          school: bulletin.school,
          trimester: bulletin.trimester,
          academicYear: bulletin.academicYear,
          grades: bulletin.grades,
          statistics: bulletin.statistics,
          generalAppreciation: bulletin.generalAppreciation
        }
      }
    });
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Erreur lors de la génération du PDF: ' + error.message
    });
  }
};

// Get all bulletins
exports.getAllBulletins = async (req, res) => {
  try {
    const bulletins = await Bulletin.find()
      .populate('student', 'firstName lastName studentId')
      .populate('class', 'name grade')
      .sort({ academicYear: -1, trimester: 1 });

    res.status(200).json({
      status: 'success',
      results: bulletins.length,
      data: { bulletins }
    });
  } catch (error) {
    console.error('Get all bulletins error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get class bulletins
exports.getClassBulletins = async (req, res) => {
  try {
    const { classId, trimester } = req.params;

    let query = { class: classId };
    if (trimester && trimester !== 'undefined') {
      query.trimester = trimester;
    }

    const bulletins = await Bulletin.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('class', 'name grade')
      .sort({ 'student.lastName': 1 });

    res.status(200).json({
      status: 'success',
      results: bulletins.length,
      data: { bulletins }
    });
  } catch (error) {
    console.error('Get class bulletins error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get student bulletins
exports.getStudentBulletins = async (req, res) => {
  try {
    const { studentId } = req.params;

    const bulletins = await Bulletin.find({ student: studentId })
      .populate('class', 'name grade')
      .sort({ academicYear: -1, trimester: 1 });

    res.status(200).json({
      status: 'success',
      results: bulletins.length,
      data: { bulletins }
    });
  } catch (error) {
    console.error('Get student bulletins error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get specific bulletin
exports.getBulletin = async (req, res) => {
  try {
    const bulletin = await Bulletin.findById(req.params.id)
      .populate('student', 'firstName lastName studentId')
      .populate('class', 'name grade');

    if (!bulletin) {
      return res.status(404).json({
        status: 'error',
        message: 'Bulletin non trouvé'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { bulletin }
    });
  } catch (error) {
    console.error('Get bulletin error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update bulletin
exports.updateBulletin = async (req, res) => {
  try {
    const { generalAppreciation } = req.body;

    const bulletin = await Bulletin.findByIdAndUpdate(
      req.params.id,
      {
        generalAppreciation,
        lastModified: new Date()
      },
      { new: true, runValidators: true }
    ).populate('student', 'firstName lastName studentId');

    if (!bulletin) {
      return res.status(404).json({
        status: 'error',
        message: 'Bulletin non trouvé'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { bulletin }
    });
  } catch (error) {
    console.error('Update bulletin error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete bulletin
exports.deleteBulletin = async (req, res) => {
  try {
    const bulletin = await Bulletin.findByIdAndDelete(req.params.id);

    if (!bulletin) {
      return res.status(404).json({
        status: 'error',
        message: 'Bulletin non trouvé'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Bulletin supprimé avec succès'
    });
  } catch (error) {
    console.error('Delete bulletin error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Publish bulletin
exports.publishBulletin = async (req, res) => {
  try {
    const bulletin = await Bulletin.findByIdAndUpdate(
      req.params.id,
      {
        isPublished: true,
        publishedAt: new Date()
      },
      { new: true }
    );

    if (!bulletin) {
      return res.status(404).json({
        status: 'error',
        message: 'Bulletin non trouvé'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Bulletin publié avec succès',
      data: { bulletin }
    });
  } catch (error) {
    console.error('Publish bulletin error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Unpublish bulletin
exports.unpublishBulletin = async (req, res) => {
  try {
    const bulletin = await Bulletin.findByIdAndUpdate(
      req.params.id,
      {
        isPublished: false,
        publishedAt: null
      },
      { new: true }
    );

    if (!bulletin) {
      return res.status(404).json({
        status: 'error',
        message: 'Bulletin non trouvé'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Bulletin dépublié avec succès',
      data: { bulletin }
    });
  } catch (error) {
    console.error('Unpublish bulletin error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};