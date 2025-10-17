import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../model/userModel.js';

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required." });
        }
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (user.isVerified) {
            return res.status(400).json({ message: "User already verified." });
        }
        if (
            user.otp !== otp ||
            !user.otpExpiry ||
            user.otpExpiry < new Date()
        ) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

       
        const token = jwt.sign(
            { userId: user._id, email: user.email, isVerified: true },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            message: "Email verified successfully.",
            token,
        });

    } catch (error) {
        console.error("OTP Verification Error:", error);
        return res.status(500).json({ message: "Server error. Please try again." });
    }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified." });
    }
    const now = new Date();
    if (user.otpExpiry && user.otpExpiry > now && user.otp) {
      return res.status(429).json({ message: "Please wait before requesting a new OTP." });
    }

    const otp = crypto.randomInt(1000, 9999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 500); 

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendEmail({
      to: email,
      subject: "Your verification code",
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
    });

    return res.status(200).json({ message: "OTP resent successfully." });

  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};