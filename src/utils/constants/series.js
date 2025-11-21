exports.SERIES = {
  A4: {
    name: 'Série A4',
    fullName: 'Série A4 - Langues et Littérature',
    description: 'Série littéraire avec orientation langues et littérature',
    subjects: {
      mandatory: ['Français', 'Philosophie', 'Histoire-Géographie', 'LV1', 'LV2', 'EPS'],
      options: ['Latin', 'Grec', 'Arts', 'Musique']
    }
  },
  C: {
    name: 'Série C',
    fullName: 'Série C - Mathématiques et Sciences Physiques',
    description: 'Série scientifique avec orientation mathématiques et physique',
    subjects: {
      mandatory: ['Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Histoire-Géographie', 'LV1', 'EPS'],
      options: ['Mathématiques Expertes', 'Mathématiques Complémentaires']
    }
  },
  D: {
    name: 'Série D',
    fullName: 'Série D - Sciences de la Nature',
    description: 'Série scientifique avec orientation sciences de la vie et de la terre',
    subjects: {
      mandatory: ['Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Histoire-Géographie', 'LV1', 'EPS'],
      options: ['SVT Complémentaire', 'Écologie']
    }
  },
  B: {
    name: 'Série B',
    fullName: 'Série B - Économie et Social',
    description: 'Série économique et sociale',
    subjects: {
      mandatory: ['SES', 'Histoire-Géographie', 'Français', 'Mathématiques', 'LV1', 'EPS'],
      options: ['Mathématiques Appliquées', 'Droit']
    }
  },
  G: {
    name: 'Série G',
    fullName: 'Série G - Gestion et Commerce',
    description: 'Série sciences de gestion et commerce',
    subjects: {
      mandatory: ['Économie-Gestion', 'Droit', 'Management', 'Français', 'LV1', 'EPS'],
      options: ['Marketing', 'Comptabilité']
    }
  },
  F: {
    name: 'Série F',
    fullName: 'Série F - Sciences et Technologies',
    description: 'Série sciences et technologies industrielles',
    subjects: {
      mandatory: ['Sciences Industrielles', 'Mathématiques', 'Physique-Chimie', 'Français', 'LV1', 'EPS'],
      options: ['Informatique', 'Électronique']
    }
  }
};

exports.getSeriesByName = (seriesCode) => {
  return this.SERIES[seriesCode] || null;
};

exports.getAllSeries = () => {
  return Object.values(this.SERIES);
};