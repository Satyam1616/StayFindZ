/**
 * Email Service — Resend integration
 * 
 * Uses Resend (https://resend.com) for transactional emails.
 * Falls back to console logging when RESEND_API_KEY is not set.
 * 
 * Setup:
 *   1. Create a free account at https://resend.com
 *   2. Get your API key from https://resend.com/api-keys
 *   3. Add RESEND_API_KEY to your .env
 *   4. (Optional) Verify your domain for custom FROM address
 */

const { Resend } = require('resend');
const { logger } = require('./logger');

// Initialize Resend client (null if no API key)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Default sender — use onboarding@resend.dev for free tier, or your verified domain
const FROM_EMAIL = process.env.FROM_EMAIL || 'StayFinder <onboarding@resend.dev>';

/**
 * Send an email via Resend, or fallback to console
 */
async function sendEmail({ to, subject, html, text }) {
  // If Resend is configured, send real email
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(text && { text }),
      });

      if (error) {
        logger.error('Resend email failed', { error, to, subject });
        throw new Error(`Email send failed: ${error.message}`);
      }

      logger.info('Email sent via Resend', { emailId: data.id, to, subject });
      return { success: true, emailId: data.id };
    } catch (err) {
      logger.error('Email service error', { error: err.message, to, subject });
      // Don't throw — email failure shouldn't crash the request
      return { success: false, error: err.message };
    }
  }

  // Fallback: log to console (dev mode)
  console.log('\n' + '═'.repeat(60));
  console.log('📧 EMAIL (console fallback — set RESEND_API_KEY for real delivery)');
  console.log('═'.repeat(60));
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('─'.repeat(60));
  // Strip HTML tags for console display
  const plainText = text || html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  console.log(plainText.substring(0, 500));
  console.log('═'.repeat(60) + '\n');

  return { success: true, emailId: 'console-fallback' };
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const subject = 'Reset your StayFinder password';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#FF5A5F,#FF8A80);padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:white;font-size:24px;font-weight:800;letter-spacing:-0.5px;">🏠 StayFinder</h1>
    </div>
    
    <!-- Body -->
    <div style="padding:40px;">
      <h2 style="margin:0 0 8px;font-size:20px;color:#222;">Reset your password</h2>
      <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Hi <strong>${name}</strong>,<br>
        We received a request to reset your password. Click the button below to choose a new one.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" 
           style="display:inline-block;padding:14px 36px;background:#FF5A5F;color:white;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
          Reset Password
        </a>
      </div>
      
      <p style="color:#999;font-size:13px;line-height:1.5;margin:24px 0 0;">
        This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
      </p>
      
      <!-- Fallback link -->
      <div style="margin-top:24px;padding:16px;background:#f9f9f9;border-radius:8px;">
        <p style="margin:0 0 4px;font-size:12px;color:#999;">If the button doesn't work, copy and paste this link:</p>
        <p style="margin:0;font-size:12px;color:#FF5A5F;word-break:break-all;">${resetUrl}</p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="padding:20px 40px;border-top:1px solid #eee;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">
        © ${new Date().getFullYear()} StayFinder · Find your perfect stay
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Hi ${name},\n\nWe received a request to reset your StayFinder password.\n\nClick this link to reset: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.\n\n— StayFinder`;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send booking confirmation email (to guest)
 */
async function sendBookingConfirmationEmail({ to, name, listingTitle, checkIn, checkOut, totalPrice, bookingId }) {
  const subject = `Booking confirmed — ${listingTitle}`;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#FF5A5F,#FF8A80);padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:white;font-size:24px;font-weight:800;">🏠 StayFinder</h1>
    </div>
    <div style="padding:40px;">
      <h2 style="margin:0 0 8px;font-size:20px;color:#222;">Booking Confirmed! 🎉</h2>
      <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Hi <strong>${name}</strong>, your stay has been confirmed.
      </p>
      <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-weight:700;color:#222;">${listingTitle}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#666;">📅 ${checkIn} — ${checkOut}</p>
        <p style="margin:0;font-size:14px;color:#666;">💰 Total: ${totalPrice}</p>
      </div>
      <div style="text-align:center;">
        <a href="${clientUrl}/bookings/${bookingId}" style="display:inline-block;padding:14px 36px;background:#FF5A5F;color:white;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
          View Booking
        </a>
      </div>
    </div>
    <div style="padding:20px 40px;border-top:1px solid #eee;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} StayFinder</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({ to, subject, html });
}

/**
 * Send booking notification email (to host)
 */
async function sendNewBookingNotificationEmail({ to, hostName, guestName, listingTitle, checkIn, checkOut, totalPrice }) {
  const subject = `New booking request — ${listingTitle}`;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#FF5A5F,#FF8A80);padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:white;font-size:24px;font-weight:800;">🏠 StayFinder</h1>
    </div>
    <div style="padding:40px;">
      <h2 style="margin:0 0 8px;font-size:20px;color:#222;">New Booking Request 📩</h2>
      <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Hi <strong>${hostName}</strong>, you've received a new booking request from <strong>${guestName}</strong>.
      </p>
      <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-weight:700;color:#222;">${listingTitle}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#666;">📅 ${checkIn} — ${checkOut}</p>
        <p style="margin:0;font-size:14px;color:#666;">💰 Total: ${totalPrice}</p>
      </div>
      <div style="text-align:center;">
        <a href="${clientUrl}/dashboard" style="display:inline-block;padding:14px 36px;background:#FF5A5F;color:white;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
          Review on Dashboard
        </a>
      </div>
    </div>
    <div style="padding:20px 40px;border-top:1px solid #eee;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} StayFinder</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({ to, subject, html });
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendNewBookingNotificationEmail,
};
