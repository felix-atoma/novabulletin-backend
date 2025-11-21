const PDFDocument = require('pdfkit');

exports.generateCollegeBulletin = async (bulletinData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(18).font('Helvetica-Bold')
         .text('BULLETIN SCOLAIRE - COLLÈGE', { align: 'center' });
      doc.moveDown();

      // Informations école
      doc.fontSize(10).font('Helvetica')
         .text(`École: ${bulletinData.student.school.name}`, { align: 'center' });
      doc.text(`Année scolaire: ${bulletinData.academicYear}`, { align: 'center' });
      doc.moveDown();

      // Informations élève
      doc.fontSize(12)
         .text(`Élève: ${bulletinData.student.firstName} ${bulletinData.student.lastName}`);
      doc.text(`Matricule: ${bulletinData.student.studentId}`);
      doc.text(`Classe: ${bulletinData.class.name}`);
      doc.text(`Trimestre: ${bulletinData.trimester}`);
      doc.moveDown();

      // Notes détaillées
      doc.font('Helvetica-Bold').text('RELEVÉ DE NOTES');
      doc.moveDown();
      
      // Table header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Matière', 50, tableTop, { width: 120 });
      doc.text('Note', 180, tableTop, { width: 50 });
      doc.text('Coef', 240, tableTop, { width: 40 });
      doc.text('Note x Coef', 290, tableTop, { width: 60 });
      doc.text('Appréciation', 360, tableTop, { width: 180 });
      
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      doc.moveDown();

      let currentY = tableTop + 20;
      let totalPoints = 0;
      let totalCoef = 0;
      
      doc.font('Helvetica').fontSize(9);
      
      bulletinData.grades.forEach(grade => {
        const noteCoef = grade.note ? (grade.note * grade.coefficient).toFixed(2) : 'N/A';
        
        doc.text(grade.subject.name, 50, currentY, { width: 120 });
        doc.text(grade.note !== null ? grade.note.toFixed(2) : 'N/A', 180, currentY, { width: 50 });
        doc.text(grade.coefficient.toString(), 240, currentY, { width: 40 });
        doc.text(noteCoef, 290, currentY, { width: 60 });
        doc.text(grade.appreciation || '-', 360, currentY, { width: 180 });
        
        if (grade.note !== null) {
          totalPoints += grade.note * grade.coefficient;
          totalCoef += grade.coefficient;
        }
        
        currentY += 22;
      });

      // Ligne de séparation
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 10;

      // Statistiques détaillées
      doc.moveDown(2);
      doc.font('Helvetica-Bold').fontSize(11).text('STATISTIQUES');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Total points: ${totalPoints.toFixed(2)}`);
      doc.text(`Total coefficients: ${totalCoef}`);
      doc.text(`Moyenne générale: ${bulletinData.statistics?.average?.toFixed(2) || (totalPoints / totalCoef).toFixed(2)}/20`);
      doc.text(`Moyenne de classe: ${bulletinData.statistics?.classAverage?.toFixed(2) || 'N/A'}/20`);
      doc.text(`Rang: ${bulletinData.statistics?.rank || 'N/A'}/${bulletinData.statistics?.totalStudents || 'N/A'}`);
      
      // Appréciation générale
      doc.moveDown();
      doc.font('Helvetica-Bold').text('APPRÉCIATION GÉNÉRALE:');
      doc.font('Helvetica').text(bulletinData.generalAppreciation || 'Aucune appréciation');
      
      // Signatures
      doc.moveDown(2);
      doc.fontSize(9);
      doc.text('Enseignant(e): ___________________', 50, doc.y, { width: 250 });
      doc.text('Directeur(trice): ___________________', 320, doc.y - 10, { width: 250 });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};