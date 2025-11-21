const PDFDocument = require('pdfkit');

exports.generateLyceeBulletin = async (bulletinData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête avec logo (si disponible)
      doc.fontSize(20).font('Helvetica-Bold')
         .text('BULLETIN SCOLAIRE - LYCÉE', { align: 'center' });
      doc.moveDown();

      // Informations école
      doc.fontSize(10).font('Helvetica')
         .text(`Établissement: ${bulletinData.student.school.name}`, { align: 'center' });
      doc.text(`Année scolaire: ${bulletinData.academicYear}`, { align: 'center' });
      doc.moveDown();

      // Informations élève
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('INFORMATIONS ÉLÈVE');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Nom et Prénom: ${bulletinData.student.firstName} ${bulletinData.student.lastName}`);
      doc.text(`Matricule: ${bulletinData.student.studentId}`);
      doc.text(`Classe: ${bulletinData.class.name}`);
      doc.text(`Trimestre: ${bulletinData.trimester.toUpperCase()}`);
      doc.moveDown();

      // Notes avec tableau détaillé
      doc.font('Helvetica-Bold').fontSize(11).text('RELEVÉ DE NOTES');
      doc.moveDown(0.5);
      
      // Table header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('MATIÈRE', 50, tableTop, { width: 110 });
      doc.text('NOTE', 170, tableTop, { width: 45, align: 'center' });
      doc.text('COEF', 225, tableTop, { width: 35, align: 'center' });
      doc.text('PTS', 270, tableTop, { width: 45, align: 'center' });
      doc.text('MOY CL', 325, tableTop, { width: 50, align: 'center' });
      doc.text('APPRÉCIATION', 385, tableTop, { width: 160 });
      
      doc.moveTo(50, tableTop + 12).lineTo(550, tableTop + 12).stroke();
      
      let currentY = tableTop + 18;
      let totalPoints = 0;
      let totalCoef = 0;
      
      doc.font('Helvetica').fontSize(8);
      
      bulletinData.grades.forEach((grade, index) => {
        const points = grade.note ? (grade.note * grade.coefficient) : 0;
        
        // Alternating row colors
        if (index % 2 === 0) {
          doc.rect(50, currentY - 3, 500, 18).fillAndStroke('#f5f5f5', '#e0e0e0');
        }
        
        doc.fillColor('black');
        doc.text(grade.subject.name, 50, currentY, { width: 110 });
        doc.text(grade.note !== null ? grade.note.toFixed(2) : '-', 170, currentY, { width: 45, align: 'center' });
        doc.text(grade.coefficient.toString(), 225, currentY, { width: 35, align: 'center' });
        doc.text(grade.note !== null ? points.toFixed(2) : '-', 270, currentY, { width: 45, align: 'center' });
        doc.text(grade.classAverage?.toFixed(2) || '-', 325, currentY, { width: 50, align: 'center' });
        doc.text(grade.appreciation || '-', 385, currentY, { width: 160 });
        
        if (grade.note !== null) {
          totalPoints += points;
          totalCoef += grade.coefficient;
        }
        
        currentY += 18;
      });

      // Ligne finale
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();

      // Statistiques détaillées
      currentY += 15;
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(11).text('RÉSULTATS ET STATISTIQUES', 50, currentY);
      currentY += 20;
      
      doc.font('Helvetica').fontSize(10);
      const moyenne = totalCoef > 0 ? (totalPoints / totalCoef).toFixed(2) : 'N/A';
      
      doc.rect(50, currentY, 250, 80).stroke();
      currentY += 10;
      
      doc.text(`Total des points: ${totalPoints.toFixed(2)}`, 60, currentY);
      doc.text(`Total des coefficients: ${totalCoef}`, 60, currentY + 15);
      doc.text(`Moyenne générale: ${moyenne}/20`, 60, currentY + 30, { font: 'Helvetica-Bold' });
      doc.text(`Moyenne de classe: ${bulletinData.statistics?.classAverage?.toFixed(2) || 'N/A'}/20`, 60, currentY + 45);
      doc.text(`Rang: ${bulletinData.statistics?.rank || 'N/A'}e sur ${bulletinData.statistics?.totalStudents || 'N/A'}`, 60, currentY + 60);
      
      // Appréciation générale
      currentY += 95;
      doc.font('Helvetica-Bold').fontSize(11).text('APPRÉCIATION GÉNÉRALE', 50, currentY);
      currentY += 20;
      doc.rect(50, currentY, 500, 60).stroke();
      doc.font('Helvetica').fontSize(9)
         .text(bulletinData.generalAppreciation || 'Aucune appréciation pour ce trimestre', 60, currentY + 10, { width: 480 });
      
      // Signatures
      currentY += 80;
      doc.fontSize(9);
      doc.text('Le Professeur Principal', 80, currentY);
      doc.text('Le Directeur', 380, currentY);
      doc.text('____________________', 80, currentY + 30);
      doc.text('____________________', 380, currentY + 30);
      
      // Footer
      doc.fontSize(7).fillColor('gray')
         .text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 50, 780, { align: 'center', width: 500 });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};