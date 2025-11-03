import nodemailer from 'nodemailer';

export const sendResetEmail = async (email, resetToken) => {
  try {
    // Use deep link instead of web URL for React Native
    const resetDeepLink = `guardiansos://reset-password?token=${resetToken}`;
    
    // Optional: Also include a web fallback URL
    const webFallbackUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `GuardianSOS <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - GuardianSOS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">GuardianSOS</h1>
            <p style="color: #e0f2fe; margin: 5px 0 0 0;">Your safety, our priority</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1e293b; text-align: center;">Reset Your Password</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              You requested to reset your password. Click the button below to create a new password in the GuardianSOS app:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetDeepLink}" 
                 style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; margin-bottom: 15px;">
                 Open in GuardianSOS App
              </a>
              <br>
              <small style="color: #64748b;">
                Or use this link if the button doesn't work: 
                <a href="${webFallbackUrl}" style="color: #3b82f6; word-break: break-all;">${webFallbackUrl}</a>
              </small>
            </div>
            
            <p style="color: #64748b; font-size: 14px; text-align: center;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                For your security, never share this link with anyone.<br>
                If you're having trouble, try opening this email on your mobile device.<br>
                GuardianSOS - Your safety, our priority
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw new Error('Failed to send reset email');
  }
};