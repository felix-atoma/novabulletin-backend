const Bulletin = require('../models/Bulletin');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Class = require('../models/Classroom');
const Payment = require('../models/Payment');
const { generateMaternelleBulletin, generatePrimaireBulletin, generateCollegeBulletin, generateLyceeBulletin } = require('../services/pdfGenerator/pdfGenerator');
const { calculateStudentStatistics } = require('../services/statisticsCalculator');
const PDFDocument = require('pdfkit');

exports.downloadBulletin = async (req, res) => {
  try {
    const { bulletinId } = req.params;

    const bulletin = await Bulletin.findById(bulletinId)
      .populate('student')
      .populate('class')
      .populate({
        path: 'student',
        populate: { path: 'school', select: 'name address phone logo' }
      });

    if (!bulletin) {
      return res.status(404).json({
        status: 'error',
        message: 'Bulletin non trouvé'
      });
    }

    let pdfBuffer;
    switch (bulletin.student.level) {
      case 'maternelle':
        pdfBuffer = await generateMaternelleBulletin(bulletin);
        break;
      case 'primaire':
        pdfBuffer = await generatePrimaireBulletin(bulletin);
        break;
      case 'college':
        pdfBuffer = await generateCollegeBulletin(bulletin);
        break;
      case 'lycee':
        pdfBuffer = await generateLyceeBulletin(bulletin);
        break;
      default:
        throw new Error('Niveau scolaire non supporté');
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=bulletin-${bulletin.student.studentId}-${bulletin.trimester}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.previewBulletin = async (req, res) => {
  try {
    const { studentId, trimester } = req.body;

    const student = await Student.findById(studentId)
      .populate('class', 'name grade teacher')
      .populate('school', 'name address phone logo');

    const grades = await Grade.find({
      student: studentId,
      trimester
    }).populate('subject', 'name code coefficient');

    const statistics = await calculateStudentStatistics(studentId, trimester);

    const bulletinData = {
      student,
      class: student.class,
      trimester,
      academicYear: student.school.academicYear,
      grades: grades.map(grade => ({
        subject: grade.subject,
        note: grade.scores.note,
        coefficient: grade.coefficient,
        appreciation: grade.scores.appreciation,
        competence: grade.scores.competence
      })),
      statistics,
      generalAppreciation: req.body.generalAppreciation || ''
    };

    let pdfBuffer;
    switch (student.level) {
      case 'maternelle':
        pdfBuffer = await generateMaternelleBulletin(bulletinData);
        break;
      case 'primaire':
        pdfBuffer = await generatePrimaireBulletin(bulletinData);
        break;
      case 'college':
        pdfBuffer = await generateCollegeBulletin(bulletinData);
        break;
      case 'lycee':
        pdfBuffer = await generateLyceeBulletin(bulletinData);
        break;
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=preview-bulletin.pdf',
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.generateClassReport = async (req, res) => {
  try {
    const { classId, trimester } = req.params;

    const classObj = await Class.findById(classId)
      .populate('teacher', 'firstName lastName')
      .populate('school', 'name address logo');

    if (!classObj) {
      return res.status(404).json({
        status: 'error',
        message: 'Classe non trouvée'
      });
    }

    const students = await Student.find({ class: classId })
      .sort('lastName firstName');

    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const stats = await calculateStudentStatistics(student._id, trimester);
        return {
          student,
          stats
        };
      })
    );

    // Sort by average
    studentsWithStats.sort((a, b) => (b.stats.average || 0) - (a.stats.average || 0));

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=rapport-classe-${classObj.name}-${trimester}.pdf`,
        'Content-Length': pdfBuffer.length
      });
      res.send(pdfBuffer);
    });

    // Header
    doc.fontSize(18).font('Helvetica-Bold')
       .text('RAPPORT DE CLASSE', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');
    doc.text(`Classe: ${classObj.name}`);
    doc.text(`Trimestre: ${trimester}`);
    doc.text(`Année scolaire: ${classObj.academicYear}`);
    doc.moveDown();

    // Table
    const tableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Rang', 50, tableTop, { width: 40 });
    doc.text('Matricule', 100, tableTop, { width: 80 });
    doc.text('Nom et Prénom', 190, tableTop, { width: 150 });
    doc.text('Moyenne', 350, tableTop, { width: 60 });
    doc.text('Mention', 420, tableTop, { width: 100 });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let currentY = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    studentsWithStats.forEach((item, index) => {
      const rank = index + 1;
      const avg = item.stats.average || 0;
      const mention = getMention(avg);

      doc.text(rank.toString(), 50, currentY, { width: 40 });
      doc.text(item.student.studentId, 100, currentY, { width: 80 });
      doc.text(`${item.student.lastName} ${item.student.firstName}`, 190, currentY, { width: 150 });
      doc.text(avg.toFixed(2), 350, currentY, { width: 60 });
      doc.text(mention, 420, currentY, { width: 100 });

      currentY += 18;

      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
    });

    // Statistics
    const classAvg = studentsWithStats.reduce((sum, item) => sum + (item.stats.average || 0), 0) / studentsWithStats.length;
    
    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(11).text('STATISTIQUES DE LA CLASSE');
    doc.font('Helvetica').fontSize(10);
    doc.text(`Effectif: ${studentsWithStats.length}`);
    doc.text(`Moyenne de classe: ${classAvg.toFixed(2)}/20`);

    doc.end();
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.generateSchoolReport = async (req, res) => {
  try {
    const { trimester } = req.params;
    const schoolId = req.user.school;

    const classes = await Class.find({ school: schoolId })
      .populate('teacher', 'firstName lastName');

    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=rapport-ecole-${trimester}.pdf`,
        'Content-Length': pdfBuffer.length
      });
      res.send(pdfBuffer);
    });

    // Header
    doc.fontSize(20).font('Helvetica-Bold')
       .text('RAPPORT GÉNÉRAL DE L\'ÉCOLE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Trimestre: ${trimester}`, { align: 'center' });
    doc.moveDown(2);

    for (const classObj of classes) {
      const students = await Student.find({ class: classObj._id });
      const studentsWithStats = await Promise.all(
        students.map(async (student) => {
          const stats = await calculateStudentStatistics(student._id, trimester);
          return stats.average || 0;
        })
      );

      const classAvg = studentsWithStats.length > 0 
        ? studentsWithStats.reduce((sum, avg) => sum + avg, 0) / studentsWithStats.length 
        : 0;

      doc.font('Helvetica-Bold').fontSize(11).text(`Classe: ${classObj.name}`);
      doc.font('Helvetica').fontSize(10);
      doc.text(`Effectif: ${students.length}`);
      doc.text(`Moyenne: ${classAvg.toFixed(2)}/20`);
      doc.moveDown();
    }

    doc.end();
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.generatePaymentReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('parent', 'firstName lastName email phone')
      .populate('student', 'firstName lastName studentId')
      .populate('school', 'name address phone logo');

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Paiement non trouvé'
      });
    }

    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=recu-${payment._id}.pdf`,
        'Content-Length': pdfBuffer.length
      });
      res.send(pdfBuffer);
    });

    // Receipt content
    doc.fontSize(20).font('Helvetica-Bold').text('REÇU DE PAIEMENT', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(10).font('Helvetica');
    doc.text(`N° Reçu: ${payment._id}`);
    doc.text(`Date: ${payment.paidDate ? payment.paidDate.toLocaleDateString('fr-FR') : 'N/A'}`);
    doc.moveDown();

    doc.text(`Parent: ${payment.parent.firstName} ${payment.parent.lastName}`);
    doc.text(`Élève: ${payment.student.firstName} ${payment.student.lastName}`);
    doc.text(`Montant: ${payment.amountPaid.toLocaleString('fr-FR')} FCFA`);
    doc.text(`Méthode: ${payment.paymentMethod}`);

    doc.end();
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.generateStudentCertificate = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .populate('class', 'name')
      .populate('school', 'name address phone logo');

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Élève non trouvé'
      });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=certificat-${student.studentId}.pdf`,
        'Content-Length': pdfBuffer.length
      });
      res.send(pdfBuffer);
    });

    // Certificate
    doc.fontSize(24).font('Helvetica-Bold')
       .text('CERTIFICAT DE SCOLARITÉ', { align: 'center' });
    doc.moveDown(3);

    doc.fontSize(12).font('Helvetica');
    doc.text(`Je soussigné(e), Directeur(trice) de ${student.school.name}, certifie que:`, { align: 'left' });
    doc.moveDown(2);

    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`${student.firstName} ${student.lastName}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');
    doc.text(`Né(e) le: ${student.dateOfBirth.toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.text(`Matricule: ${student.studentId}`, { align: 'center' });
    doc.moveDown(2);

    doc.text(`Est régulièrement inscrit(e) en classe de ${student.class.name}`, { align: 'center' });
    doc.text(`Pour l'année scolaire ${student.school.academicYear}`, { align: 'center' });
    doc.moveDown(3);

    doc.text(`Fait à ${student.school.address}, le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.moveDown(2);
    doc.text('Le Directeur', { align: 'right' });

    doc.end();
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.exportStudents = async (req, res) => {
  try {
    const schoolId = req.user.school;

    const students = await Student.find({ school: schoolId })
      .populate('class', 'name')
      .sort('class lastName firstName');

    const exportData = students.map(student => ({
      matricule: student.studentId,
      nom: student.lastName,
      prenom: student.firstName,
      dateNaissance: student.dateOfBirth.toLocaleDateString('fr-FR'),
      classe: student.class?.name || 'N/A',
      niveau: student.level
    }));

    res.status(200).json({
      status: 'success',
      results: exportData.length,
      data: {
        students: exportData
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.exportGrades = async (req, res) => {
  try {
    const { classId, trimester } = req.params;

    const students = await Student.find({ class: classId })
      .sort('lastName firstName');

    const exportData = await Promise.all(
      students.map(async (student) => {
        const grades = await Grade.find({
          student: student._id,
          trimester
        }).populate('subject', 'name');

        const stats = await calculateStudentStatistics(student._id, trimester);

        return {
          matricule: student.studentId,
          nom: student.lastName,
          prenom: student.firstName,
          moyenne: stats.average || 0,
          rang: stats.rank || 'N/A',
          notes: grades.map(g => ({
            matiere: g.subject.name,
            note: g.scores.note,
            appreciation: g.scores.appreciation
          }))
        };
      })
    );

    res.status(200).json({
      status: 'success',
      results: exportData.length,
      data: {
        grades: exportData
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Helper function
function getMention(average) {
  if (average >= 16) return 'Très Bien';
  if (average >= 14) return 'Bien';
  if (average >= 12) return 'Assez Bien';
  if (average >= 10) return 'Passable';
  return 'Insuffisant';
}