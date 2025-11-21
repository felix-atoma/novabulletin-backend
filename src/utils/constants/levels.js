exports.LEVELS = {
  MATERNELLE: {
    name: 'Maternelle',
    grades: [
      { code: 'PS', name: 'Petite Section' },
      { code: 'MS', name: 'Moyenne Section' },
      { code: 'GS', name: 'Grande Section' }
    ],
    evaluationType: 'competences',
    competences: [
      { code: 'acquired', name: 'Acquis', color: 'green' },
      { code: 'in_progress', name: 'En cours d\'acquisition', color: 'yellow' },
      { code: 'not_acquired', name: 'Non acquis', color: 'red' }
    ],
    domains: [
      'Mobiliser le langage dans toutes ses dimensions',
      'Agir, s\'exprimer, comprendre à travers l\'activité physique',
      'Agir, s\'exprimer, comprendre à travers les activités artistiques',
      'Construire les premiers outils pour structurer sa pensée'
    ]
  },
  PRIMAIRE: {
    name: 'Primaire',
    grades: [
      { code: 'CP', name: 'Cours Préparatoire' },
      { code: 'CE1', name: 'Cours Élémentaire 1ère année' },
      { code: 'CE2', name: 'Cours Élémentaire 2ème année' },
      { code: 'CM1', name: 'Cours Moyen 1ère année' },
      { code: 'CM2', name: 'Cours Moyen 2ème année' }
    ],
    evaluationType: 'notes',
    maxScore: 20,
    hasCoefficients: false
  },
  COLLEGE: {
    name: 'Collège',
    grades: [
      { code: '6ème', name: 'Sixième' },
      { code: '5ème', name: 'Cinquième' },
      { code: '4ème', name: 'Quatrième' },
      { code: '3ème', name: 'Troisième' }
    ],
    evaluationType: 'notes',
    maxScore: 20,
    hasCoefficients: true,
    preparation: 'BEPC'
  },
  LYCEE: {
    name: 'Lycée',
    grades: [
      { code: '2nde', name: 'Seconde' },
      { code: '1ère', name: 'Première' },
      { code: 'Tle', name: 'Terminale' }
    ],
    evaluationType: 'notes',
    maxScore: 20,
    hasCoefficients: true,
    series: ['A4', 'C', 'D', 'B', 'G', 'F'],
    preparation: 'BAC'
  }
};

exports.getLevelByGrade = (grade) => {
  for (const [level, data] of Object.entries(this.LEVELS)) {
    if (data.grades.some(g => g.code === grade)) {
      return level.toLowerCase();
    }
  }
  return null;
};

exports.getGradeName = (gradeCode) => {
  for (const level of Object.values(this.LEVELS)) {
    const grade = level.grades.find(g => g.code === gradeCode);
    if (grade) return grade.name;
  }
  return gradeCode;
};