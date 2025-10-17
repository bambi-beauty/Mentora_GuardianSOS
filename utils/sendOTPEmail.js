import nodemailer from 'nodemailer';
export const sendOTPEmail = async (email, otp) => {
  try {
    
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      port:543,
      secure:false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Mail options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    };

    // Send mail
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.response);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};
