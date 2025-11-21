exports.calculateAverage = (grades) => {
  if (!grades || grades.length === 0) return 0;

  let totalPoints = 0;
  let totalCoefficients = 0;

  grades.forEach(grade => {
    if (grade.note !== null && grade.note !== undefined) {
      totalPoints += grade.note * (grade.coefficient || 1);
      totalCoefficients += grade.coefficient || 1;
    }
  });

  return totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
};

exports.calculateMention = (average) => {
  if (average >= 16) return 'Excellent';
  if (average >= 14) return 'Très Bien';
  if (average >= 12) return 'Bien';
  if (average >= 10) return 'Assez Bien';
  return 'Passable';
};

exports.validateGrade = (note, maxScore = 20) => {
  if (note === null || note === undefined) return true;
  if (typeof note !== 'number') return false;
  if (note < 0 || note > maxScore) return false;
  return true;
};

exports.calculateRank = (studentAverage, classAverages) => {
  const sortedAverages = [...classAverages].sort((a, b) => b - a);
  return sortedAverages.indexOf(studentAverage) + 1;
};