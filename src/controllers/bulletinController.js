const Bulletin = require('../models/Bulletin');
const Student = require('../models/Student');
const Grade = require('../models/Grade');

// PDF Download - Simplified version that works without PDF dependencies
exports.downloadBulletinPDF = async (req, res) => {
  try {
    const bulletin = await Bulletin.findById(req.params.id)
      .populate('student', 'firstName lastName studentId level')
      .populate('class', 'name grade')
      .populate('school', 'name');

    if (!bulletin) {
      return res.status(404).json({
        status: 'error',
        message: 'Bulletin non trouvé'
      });
    }

    // Create simple PDF content (text-based for now)
    const pdfContent = `
      BULLETIN SCOLAIRE
      =================
      
      Élève: ${bulletin.student.firstName} ${bulletin.student.lastName}
      Classe: ${bulletin.class?.name || 'Non spécifiée'}
      Trimestre: ${bulletin.trimester}
      Année scolaire: ${bulletin.academicYear}
      
      Notes:
      ${bulletin.grades.map(grade => 
        `- ${grade.subject?.name || 'Matière'}: ${grade.note}/20`
      ).join('\n')}
      
      Appréciation générale: ${bulletin.generalAppreciation}
      
      Moyenne générale: ${bulletin.statistics?.average || 'Non calculée'}
    `;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=bulletin-${bulletin.student.studentId}-${bulletin.trimester}.pdf`,
    });

    // For now, return JSON with success message since PDF generation might not be implemented
    res.status(200).json({
      status: 'success',
      message: 'PDF download endpoint reached - PDF generation would happen here',
      data: {
        bulletin: {
          _id: bulletin._id,
          student: bulletin.student,
          trimester: bulletin.trimester,
          academicYear: bulletin.academicYear
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

// Generate bulletin
exports.generateBulletin = async (req, res) => {
  try {
    const { studentId, trimester, academicYear = '2024-2025' } = req.body;

    console.log('Generating bulletin for student:', studentId, 'trimester:', trimester);

    const student = await Student.findById(studentId)
      .populate('class', 'name grade')
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

    // Calculate basic statistics
    let totalNotes = 0;
    let totalCoefficients = 0;
    
    const gradeDetails = grades.map(grade => {
      const note = grade.note || 0;
      const coefficient = grade.coefficient || grade.subject?.coefficient || 1;
      
      totalNotes += note * coefficient;
      totalCoefficients += coefficient;

      return {
        subject: grade.subject ? {
          _id: grade.subject._id,
          name: grade.subject.name,
          code: grade.subject.code,
          coefficient: grade.subject.coefficient
        } : { name: 'Matière inconnue', coefficient: 1 },
        note: note,
        coefficient: coefficient,
        appreciation: grade.appreciation || 'Non spécifié'
      };
    });

    const average = totalCoefficients > 0 ? (totalNotes / totalCoefficients).toFixed(2) : 0;

    const statistics = {
      average: parseFloat(average),
      totalSubjects: grades.length,
      totalNotes: totalNotes,
      totalCoefficients: totalCoefficients
    };

    // Create bulletin
    const bulletinData = {
      student: studentId,
      class: student.class?._id || null,
      trimester: trimester,
      academicYear: academicYear,
      grades: gradeDetails,
      statistics: statistics,
      generalAppreciation: req.body.generalAppreciation || 'Bulletin généré automatiquement',
      isPublished: true,
      publishedAt: new Date()
    };

    const bulletin = await Bulletin.create(bulletinData);

    // Populate the response
    const populatedBulletin = await Bulletin.findById(bulletin._id)
      .populate('student', 'firstName lastName studentId')
      .populate('class', 'name grade');

    res.status(201).json({
      status: 'success',
      message: 'Bulletin généré avec succès',
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

// Get class bulletins
exports.getClassBulletins = async (req, res) => {
  try {
    const { classId, trimester } = req.params;

    console.log('Getting bulletins for class:', classId, 'trimester:', trimester);

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
      data: {
        bulletins
      }
    });
  } catch (error) {
    console.error('Get class bulletins error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
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
      data: {
        bulletins
      }
    });
  } catch (error) {
    console.error('Get all bulletins error:', error);
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

    console.log('Getting bulletins for student:', studentId);

    const bulletins = await Bulletin.find({ student: studentId })
      .populate('class', 'name grade')
      .sort({ trimester: 1, academicYear: 1 });

    res.status(200).json({
      status: 'success',
      results: bulletins.length,
      data: {
        bulletins
      }
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
      data: {
        bulletin
      }
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
      data: {
        bulletin
      }
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
      data: {
        bulletin
      }
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
      data: {
        bulletin
      }
    });
  } catch (error) {
    console.error('Unpublish bulletin error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Generate bulk bulletins
exports.generateBulkBulletins = async (req, res) => {
  try {
    const { classId, trimester, academicYear = '2024-2025' } = req.body;

    console.log('Generating bulk bulletins for class:', classId, 'trimester:', trimester);

    const students = await Student.find({ class: classId })
      .populate('class', 'name grade');

    if (students.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Aucun élève trouvé dans cette classe'
      });
    }

    let generated = 0;
    let failed = 0;
    const errors = [];

    for (const student of students) {
      try {
        // Check if bulletin already exists
        const existingBulletin = await Bulletin.findOne({
          student: student._id,
          class: classId,
          trimester: trimester
        });

        if (existingBulletin) {
          errors.push(`Bulletin existe déjà pour ${student.firstName} ${student.lastName}`);
          failed++;
          continue;
        }

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
        
        const gradeDetails = grades.map(grade => {
          const note = grade.note || 0;
          const coefficient = grade.coefficient || grade.subject?.coefficient || 1;
          
          totalNotes += note * coefficient;
          totalCoefficients += coefficient;

          return {
            subject: grade.subject ? {
              _id: grade.subject._id,
              name: grade.subject.name,
              code: grade.subject.code,
              coefficient: grade.subject.coefficient
            } : { name: 'Matière inconnue', coefficient: 1 },
            note: note,
            coefficient: coefficient,
            appreciation: grade.appreciation || 'Non spécifié'
          };
        });

        const average = totalCoefficients > 0 ? (totalNotes / totalCoefficients).toFixed(2) : 0;

        const statistics = {
          average: parseFloat(average),
          totalSubjects: grades.length,
          totalNotes: totalNotes,
          totalCoefficients: totalCoefficients
        };

        // Create bulletin
        const bulletinData = {
          student: student._id,
          class: classId,
          trimester: trimester,
          academicYear: academicYear,
          grades: gradeDetails,
          statistics: statistics,
          generalAppreciation: 'Bulletin généré en masse',
          isPublished: false
        };

        await Bulletin.create(bulletinData);
        generated++;
        
      } catch (err) {
        errors.push(`Erreur pour ${student.firstName} ${student.lastName}: ${err.message}`);
        failed++;
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Génération terminée: ${generated} bulletins générés, ${failed} échecs`,
      data: {
        generated,
        failed,
        errors: errors.slice(0, 10) // Limit errors in response
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