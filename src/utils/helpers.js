exports.generateStudentId = (schoolCode, level, sequence) => {
  const levelCode = getLevelCode(level);
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = sequence.toString().padStart(4, '0');
  
  return `${schoolCode}${levelCode}${year}${seq}`.toUpperCase();
};

exports.generateTeacherId = (schoolCode, sequence) => {
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = sequence.toString().padStart(3, '0');
  
  return `T${schoolCode}${year}${seq}`.toUpperCase();
};

exports.formatPhoneNumber = (phone) => {
  // Normaliser les numéros togolais
  phone = phone.replace(/\s/g, '');
  
  if (phone.startsWith('+228')) {
    return phone;
  } else if (phone.startsWith('00228')) {
    return `+${phone.slice(2)}`;
  } else if (phone.startsWith('228')) {
    return `+${phone}`;
  } else if (phone.length === 8) {
    return `+228${phone}`;
  }
  
  return phone;
};

exports.calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

exports.formatCurrency = (amount, currency = 'XOF') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

exports.getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  // Si on est après août, l'année scolaire commence cette année
  if (month >= 9) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

exports.getTrimesterDates = (academicYear, trimester) => {
  const [startYear] = academicYear.split('-').map(Number);
  const trimesters = {
    first: {
      start: new Date(startYear, 8, 15), // 15 septembre
      end: new Date(startYear, 11, 20)   // 20 décembre
    },
    second: {
      start: new Date(startYear + 1, 0, 8),  // 8 janvier
      end: new Date(startYear + 1, 3, 10)    // 10 avril
    },
    third: {
      start: new Date(startYear + 1, 3, 25), // 25 avril
      end: new Date(startYear + 1, 6, 15)    // 15 juillet
    }
  };
  
  return trimesters[trimester] || null;
};

function getLevelCode(level) {
  const codes = {
    'maternelle': 'M',
    'primaire': 'P',
    'college': 'C',
    'lycee': 'L'
  };
  return codes[level] || 'X';
}

exports.sanitizeName = (name) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/\s+/g, ' ');
};

exports.generatePassword = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
};