exports.COEFFICIENTS = {
  // Coefficients pour le BAC Togolais
  BAC: {
    // Série A4
    A4: {
      'Français': 4,
      'Philosophie': 4,
      'Histoire-Géographie': 3,
      'Langue Vivante 1': 3,
      'Langue Vivante 2': 2,
      'Mathématiques': 2,
      'SVT': 2,
      'EPS': 1,
      'Option 1': 2,
      'Option 2': 2
    },
    // Série C
    C: {
      'Mathématiques': 5,
      'Physique-Chimie': 4,
      'SVT': 3,
      'Français': 3,
      'Histoire-Géographie': 2,
      'Langue Vivante 1': 2,
      'EPS': 1,
      'Option': 2
    },
    // Série D
    D: {
      'Mathématiques': 4,
      'Physique-Chimie': 4,
      'SVT': 4,
      'Français': 3,
      'Histoire-Géographie': 2,
      'Langue Vivante 1': 2,
      'EPS': 1,
      'Option': 2
    },
    // Série B
    B: {
      'SES': 5,
      'Histoire-Géographie': 3,
      'Français': 3,
      'Mathématiques': 3,
      'Langue Vivante 1': 2,
      'EPS': 1,
      'Option 1': 2,
      'Option 2': 2
    }
  },
  
  // Coefficients pour le BEPC
  BEPC: {
    'Français': 3,
    'Mathématiques': 3,
    'Histoire-Géographie': 2,
    'SVT': 2,
    'Physique-Chimie': 2,
    'Anglais': 2,
    'EPS': 1
  },
  
  // Coefficients par défaut pour le collège
  COLLEGE: {
    'Français': 3,
    'Mathématiques': 3,
    'Histoire-Géographie': 2,
    'SVT': 2,
    'Physique-Chimie': 2,
    'Anglais': 2,
    'EPS': 1,
    'Technologie': 1
  },
  
  // Coefficients par défaut pour le primaire (tous à 1)
  PRIMAIRE: {
    'Français': 1,
    'Mathématiques': 1,
    'Éveil': 1,
    'EPS': 1
  }
};

exports.getCoefficients = (level, series = null) => {
  if (level === 'lycee' && series) {
    return this.COEFFICIENTS.BAC[series] || this.COEFFICIENTS.BAC.A4;
  } else if (level === 'college') {
    return this.COEFFICIENTS.COLLEGE;
  } else if (level === 'primaire') {
    return this.COEFFICIENTS.PRIMAIRE;
  }
  return this.COEFFICIENTS.PRIMAIRE; // Par défaut
};

exports.calculateBACPoints = (grades, series) => {
  const coefficients = this.COEFFICIENTS.BAC[series];
  let totalPoints = 0;
  let totalCoefficients = 0;

  grades.forEach(grade => {
    const coef = coefficients[grade.subject] || 1;
    totalPoints += grade.note * coef;
    totalCoefficients += coef;
  });

  return {
    totalPoints: parseFloat(totalPoints.toFixed(2)),
    average: parseFloat((totalPoints / totalCoefficients).toFixed(2)),
    totalCoefficients
  };
};