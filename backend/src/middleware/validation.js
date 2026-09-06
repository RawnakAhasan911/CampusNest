/**
 * Input Validation & University Email Check Middleware
 */

function isUniversityEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split('@')[1];
  if (!domain) return false;

  // Checks for university domains (.edu, .ac.uk, .edu.bd, .edu.au, or university-like domains)
  return (
    domain.endsWith('.edu') ||
    domain.includes('.ac.') ||
    domain.endsWith('.ac') ||
    domain.includes('.edu.') ||
    domain === 'university.edu' ||
    domain === 'student.edu' ||
    domain === 'campus.edu' ||
    domain.includes('univ') ||
    domain.includes('college')
  );
}

function validateRegister(req, res, next) {
  const { name, email, phone, password, department, yearOfStudy } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Valid student name is required' });
  }

  if (!email || !isUniversityEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'A valid university email address is required (e.g. name@university.edu or user@dept.ac.*)',
    });
  }

  if (!phone || phone.trim().length < 7) {
    return res.status(400).json({ success: false, message: 'Valid contact phone number is required' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long with a combination of letters and numbers',
    });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  next();
}

module.exports = {
  isUniversityEmail,
  validateRegister,
  validateLogin,
};
