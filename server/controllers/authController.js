/**
 * Auth Controller
 * Registration, login, logout, refresh token, profile management
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  userSelectFields,
} = require('../utils/tokens');

// POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existing = await req.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('A user with this email already exists.', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await req.prisma.user.create({
      data: { name, email, passwordHash, role },
      select: userSelectFields,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful.',
      data: { user, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password hash
    const user = await req.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Generate tokens
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      status: 'success',
      message: 'Login successful.',
      data: { user: userData, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/logout
const logout = (_req, res) => {
  clearRefreshTokenCookie(res);
  res.json({ status: 'success', message: 'Logged out successfully.' });
};

// POST /api/v1/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      throw new AppError('No refresh token provided.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await req.prisma.user.findUnique({
      where: { id: decoded.id },
      select: userSelectFields,
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    // Rotate tokens
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      status: 'success',
      data: { user, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: userSelectFields,
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    res.json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/auth/me
const updateMe = async (req, res, next) => {
  try {
    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: req.body,
      select: userSelectFields,
    });

    res.json({
      status: 'success',
      message: 'Profile updated.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, refresh, getMe, updateMe };
