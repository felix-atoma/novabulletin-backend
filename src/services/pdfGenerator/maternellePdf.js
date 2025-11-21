const PDFDocument = require('pdfkit');

exports.generateMaternelleBulletin = async (bulletinData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(16).font('Helvetica-Bold')
         .text('BULLETIN SCOLAIRE - MATERNELLE', { align: 'center' });
      doc.moveDown();

      // Informations école
      doc.fontSize(10).font('Helvetica')
         .text(`École: ${bulletinData.school.name}`, { align: 'center' });
      doc.text(`Année scolaire: ${bulletinData.academicYear}`, { align: 'center' });
      doc.moveDown();

      // Informations élève
      doc.fontSize(12)
         .text(`Élève: ${bulletinData.student.firstName} ${bulletinData.student.lastName}`);
      doc.text(`Classe: ${bulletinData.class.name}`);
      doc.text(`Trimestre: ${bulletinData.trimester}`);
      doc.moveDown();

      // Compétences
      doc.font('Helvetica-Bold').text('ÉVALUATION PAR COMPÉTENCES');
      doc.moveDown();
      
      bulletinData.grades.forEach(grade => {
        doc.font('Helvetica').text(`${grade.subject.name}:`, { continued: true });
        doc.text(` ${getCompetenceText(grade.competence)}`, { indent: 20 });
        
        if (grade.appreciation) {
          doc.text(`Appréciation: ${grade.appreciation}`, { indent: 30 });
        }
        doc.moveDown(0.5);
      });

      // Appréciation générale
      doc.moveDown();
      doc.font('Helvetica-Bold').text('APPRÉCIATION GÉNÉRALE:');
      doc.font('Helvetica').text(bulletinData.generalAppreciation || 'Aucune appréciation');
      
      // Signatures
      doc.moveDown(2);
      doc.text('Enseignant(e): ___________________', { align: 'left' });
      doc.text('Directeur(trice): ___________________', { align: 'right' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

function getCompetenceText(competence) {
  const competences = {
    'acquired': '✅ Acquis',
    'in_progress': '🔄 En cours d\'acquisition',
    'not_acquired': '❌ Non acquis'
  };
  return competences[competence] || '⏸️ Non évalué';
}