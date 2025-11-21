exports.requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: `Accès réservé aux ${requiredRole}s et administrateurs`
      });
    }
    next();
  };
};

exports.requireSchoolAccess = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  if (!req.user.school) {
    return res.status(403).json({
      status: 'error',
      message: 'Aucune école associée à votre compte'
    });
  }

  // Pour les directeurs, enseignants, parents - vérifier qu'ils appartiennent à la bonne école
  if (req.params.schoolId && req.params.schoolId !== req.user.school.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'Accès non autorisé à cette école'
    });
  }

  next();
};

exports.canManageStudents = (req, res, next) => {
  const allowedRoles = ['admin', 'director', 'teacher'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Permission insuffisante pour gérer les élèves'
    });
  }
  next();
};

exports.canManageGrades = (req, res, next) => {
  const allowedRoles = ['admin', 'director', 'teacher'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Permission insuffisante pour gérer les notes'
    });
  }
  next();
};