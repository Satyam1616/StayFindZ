/**
 * Google OAuth Controller
 * 
 * Handles Google Sign-In by verifying the ID token from the frontend,
 * then creating or finding the user and issuing JWT tokens.
 * 
 * No passport.js needed — uses Google's token verification directly.
 */

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const isConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const googleClient = isConfigured
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

/**
 * POST /api/v1/auth/google
 * Body: { credential } — the Google ID token from frontend
 */
const googleAuth = async (req, res, next) => {
  try {
    if (!googleClient) {
      throw new AppError('Google OAuth is not configured on this server.', 503);
    }

    const { credential } = req.body;
    if (!credential) {
      throw new AppError('Google credential is required.', 400);
    }

    // Verify the Google ID token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (err) {
      logger.error('Google token verification failed', { error: err.message });
      throw new AppError('Invalid Google credential.', 401);
    }

    const payload = ticket.getPayload();
    const { email, name, picture, email_verified, sub: googleId } = payload;

    if (!email_verified) {
      throw new AppError('Google email is not verified.', 401);
    }

    // Find or create user
    let user = await req.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user from Google profile
      user = await req.prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          passwordHash: `google_oauth_${googleId}`, // No password for OAuth users
          role: 'guest',
          avatarUrl: picture || null,
          emailVerified: true,
        },
      });

      logger.info('New user created via Google OAuth', { userId: user.id, email });
    } else {
      // Update avatar and email verified status if needed
      if (!user.avatarUrl && picture) {
        await req.prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: picture, emailVerified: true },
        });
      }
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info('Google OAuth login successful', { userId: user.id, email });

    res.json({
      status: 'success',
      message: 'Logged in with Google.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { googleAuth, isConfigured };
