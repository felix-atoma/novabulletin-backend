const PDFDocument = require('pdfkit');

exports.generatePrimaireBulletin = async (bulletinData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(16).font('Helvetica-Bold')
         .text('BULLETIN SCOLAIRE - PRIMAIRE', { align: 'center' });
      doc.moveDown();

      // Informations école
      doc.fontSize(10).font('Helvetica')
         .text(`École: ${bulletinData.student.school.name}`, { align: 'center' });
      doc.text(`Année scolaire: ${bulletinData.academicYear}`, { align: 'center' });
      doc.moveDown();

      // Informations élève
      doc.fontSize(12)
         .text(`Élève: ${bulletinData.student.firstName} ${bulletinData.student.lastName}`);
      doc.text(`Classe: ${bulletinData.class.name}`);
      doc.text(`Trimestre: ${bulletinData.trimester}`);
      doc.moveDown();

      // Notes
      doc.font('Helvetica-Bold').text('NOTES ET APPRÉCIATIONS');
      doc.moveDown();
      
      // Table header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Matière', 50, tableTop, { width: 150 });
      doc.text('Note/20', 220, tableTop, { width: 60 });
      doc.text('Coef', 290, tableTop, { width: 40 });
      doc.text('Appréciation', 340, tableTop, { width: 200 });
      
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      doc.moveDown();

      let currentY = tableTop + 20;
      doc.font('Helvetica').fontSize(9);
      
      bulletinData.grades.forEach(grade => {
        doc.text(grade.subject.name, 50, currentY, { width: 150 });
        doc.text(grade.note !== null ? grade.note.toFixed(2) : 'N/A', 220, currentY, { width: 60 });
        doc.text(grade.coefficient.toString(), 290, currentY, { width: 40 });
        doc.text(grade.appreciation || '-', 340, currentY, { width: 200 });
        currentY += 20;
      });

      // Statistiques
      doc.moveDown(2);
      doc.font('Helvetica-Bold').fontSize(11).text('RÉSULTATS');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Moyenne générale: ${bulletinData.statistics?.average?.toFixed(2) || 'N/A'}/20`);
      doc.text(`Rang: ${bulletinData.statistics?.rank || 'N/A'}/${bulletinData.statistics?.totalStudents || 'N/A'}`);
      
      // Appréciation générale
      doc.moveDown();
      doc.font('Helvetica-Bold').text('APPRÉCIATION GÉNÉRALE:');
      doc.font('Helvetica').text(bulletinData.generalAppreciation || 'Aucune appréciation');
      
      // Signatures
      doc.moveDown(2);
      doc.text('Enseignant(e): ___________________', 50, doc.y, { width: 250 });
      doc.text('Directeur(trice): ___________________', 320, doc.y - 12, { width: 250 });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};