exports.MENTIONS = [
  {
    min: 16,
    max: 20,
    code: 'EXCELLENT',
    name: 'Excellent',
    description: 'Excellente maîtrise des connaissances et compétences',
    color: 'green'
  },
  {
    min: 14,
    max: 15.99,
    code: 'TRES_BIEN',
    name: 'Très Bien',
    description: 'Très bonne maîtrise des connaissances et compétences',
    color: 'blue'
  },
  {
    min: 12,
    max: 13.99,
    code: 'BIEN',
    name: 'Bien',
    description: 'Bonne maîtrise des connaissances et compétences',
    color: 'teal'
  },
  {
    min: 10,
    max: 11.99,
    code: 'ASSEZ_BIEN',
    name: 'Assez Bien',
    description: 'Maîtrise satisfaisante des connaissances et compétences',
    color: 'yellow'
  },
  {
    min: 8,
    max: 9.99,
    code: 'PASSABLE',
    name: 'Passable',
    description: 'Maîtrise fragile des connaissances et compétences',
    color: 'orange'
  },
  {
    min: 0,
    max: 7.99,
    code: 'INSUFFISANT',
    name: 'Insuffisant',
    description: 'Maîtrise insuffisante des connaissances et compétences',
    color: 'red'
  }
];

exports.getMention = (average) => {
  const mention = this.MENTIONS.find(m => average >= m.min && average <= m.max);
  return mention || this.MENTIONS[this.MENTIONS.length - 1]; // Insuffisant par défaut
};

exports.getMentionByCode = (code) => {
  return this.MENTIONS.find(m => m.code === code);
};

exports.MENTIONS_BAC = {
  'TRES_HONORABLE': { min: 16, name: 'Très Honorable' },
  'HONORABLE': { min: 14, name: 'Honorable' },
  'ASSEZ_BIEN': { min: 12, name: 'Assez Bien' },
  'PASSABLE': { min: 10, name: 'Passable' },
  'AJOURNE': { min: 0, name: 'Ajourné' }
};

exports.getBACMention = (average) => {
  if (average >= 16) return 'TRES_HONORABLE';
  if (average >= 14) return 'HONORABLE';
  if (average >= 12) return 'ASSEZ_BIEN';
  if (average >= 10) return 'PASSABLE';
  return 'AJOURNE';
};