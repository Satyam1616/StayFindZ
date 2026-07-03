/**
 * Password Reset Controller
 * Forgot password request and reset token verification
 * Uses Resend for email delivery (falls back to console in dev)
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { AppError } = require('../middleware/errorHandler');
const { sendPasswordResetEmail } = require('../utils/email');
const { logger } = require('../utils/logger');

// POST /api/v1/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await req.prisma.user.findUnique({ where: { email } });

    // Always respond with success to prevent email enumeration
    if (!user) {
      return res.json({
        status: 'success',
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Invalidate any existing reset tokens for this user
    await req.prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store in database — expires in 1 hour
    await req.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Build reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email via Resend (or console fallback)
    const emailResult = await sendPasswordResetEmail({
      to: email,
      name: user.name,
      resetUrl,
    });

    logger.info('Password reset requested', {
      userId: user.id,
      email,
      emailSent: emailResult.success,
      emailId: emailResult.emailId,
    });

    res.json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been sent.',
      // DEV ONLY — expose reset URL for testing without real email
      ...(process.env.NODE_ENV === 'development' && { dev: { resetUrl } }),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body;

    // Hash the token to match stored value
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const resetRecord = await req.prisma.passwordReset.findFirst({
      where: {
        token: tokenHash,
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!resetRecord) {
      throw new AppError('Invalid or expired reset token. Please request a new one.', 400);
    }

    // Verify email matches
    if (resetRecord.user.email !== email) {
      throw new AppError('Invalid reset request.', 400);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and mark token as used (transaction)
    await req.prisma.$transaction([
      req.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      req.prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
    ]);

    logger.info('Password reset completed', { userId: resetRecord.userId, email });

    res.json({
      status: 'success',
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { forgotPassword, resetPassword };
