import User from "../model/userModel.js";
import jwt from 'jsonwebtoken';
import { sendOTPEmail } from "../utils/sendOTPEmail.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendResetEmail } from "../utils/sendResetEmail.js";

// 🔐 SIGNUP CONTROLLER
export const signup = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, agreeToTerms, location } = req.body;

    // Basic validation
    if (!name || !email || !phoneNumber || !password || !agreeToTerms) {
      return res.status(400).json({ message: "All fields except location are required." });
    }

    if (!location || !location.country) {
      return res.status(400).json({ message: "Country is required in location." });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and include uppercase, lowercase, digit, and special character.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Generate OTP and expiry
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Create new user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phoneNumber,
      password,
      agreeToTerms,
      otp,
      otpExpiry,
      location,
    });

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      await User.findByIdAndDelete(user._id); // rollback user creation
      return res.status(500).json({
        message: "Failed to send OTP email. Please try signing up again.",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isVerified: user.isVerified },
      process.env.JWT_SECRET,
      { expiresIn: "60d" }
    );

    return res.status(201).json({
      token,
      message: "User registered successfully. Please verify your email with the OTP sent.",
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// 🔐 LOGIN CONTROLLER
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    
    console.log("Received login request for email:", email);
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Normalize email for lookup
    email = email.trim().toLowerCase();
    console.log("Login attempt for email:", email);

    // Find user by email
    const user = await User.findOne({ email });
    console.log("User found in DB:", user ? "Yes" : "No");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isVerified: user.isVerified },
      process.env.JWT_SECRET,
      { expiresIn: '60d' }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        location: user.location,
        onboardingCompleted: user.onboardingCompleted,
      }
    });
  } catch (error) {
    console.error("Login Error:", error.message || error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// 🔐 GET USER PROFILE CONTROLLER
export const getUser = async (req, res) => {
  try {
    const userId = req.user._id; 

    const user = await User.findById(userId).select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔐 COMPLETE ONBOARDING CONTROLLER
export const completeOnboarding = async (req, res) => {
  try {
    const userId = req.user._id; 

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.onboardingCompleted = true;
    await user.save();

    res.status(200).json({ 
      message: 'Onboarding marked as complete', 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        location: user.location,
        onboardingCompleted: user.onboardingCompleted,
      }
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔐 DELETE ACCOUNT CONTROLLER
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find and delete user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 🔐 FORGOT PASSWORD CONTROLLER
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    
    // For security, don't reveal if email exists or not
    if (!user) {
      return res.json({
        success: true,
        message: "If this email is registered, you will receive a password reset link shortly."
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_RESET_SECRET || process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save reset token and expiry to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    try {
      await sendResetEmail(user.email, resetToken);
      console.log(`Password reset email sent to: ${user.email}`);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      // Clear the reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.status(500).json({
        message: "Failed to send reset email. Please try again."
      });
    }

    return res.json({
      success: true,
      message: "If this email is registered, you will receive a password reset link shortly."
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ 
      message: "Server error. Please try again later." 
    });
  }
};

// 🔐 RESET PASSWORD CONTROLLER
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        message: "Reset token and new password are required." 
      });
    }

    // Password strength validation (same as signup)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and include uppercase, lowercase, digit, and special character.",
      });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_RESET_SECRET || process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({ 
        message: "Invalid or expired reset token." 
      });
    }

    // Find user by token and check expiry
    const user = await User.findOne({
      _id: decoded.userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired reset token." 
      });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`Password reset successfully for user: ${user.email}`);

    return res.json({
      success: true,
      message: "Password reset successfully. You can now login with your new password."
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ 
      message: "Server error. Please try again later." 
    });
  }
};

// 🔐 VERIFY RESET TOKEN CONTROLLER
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        message: "Reset token is required." 
      });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_RESET_SECRET || process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({ 
        valid: false,
        message: "Invalid or expired reset token." 
      });
    }

    // Find user by token and check expiry
    const user = await User.findOne({
      _id: decoded.userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        valid: false,
        message: "Invalid or expired reset token." 
      });
    }

    return res.json({
      valid: true,
      message: "Reset token is valid."
    });

  } catch (error) {
    console.error("Verify Reset Token Error:", error);
    return res.status(500).json({ 
      valid: false,
      message: "Server error. Please try again later." 
    });
  }
};

// 🔐 UPDATE USER PROFILE CONTROLLER
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, phoneNumber, location } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (location) user.location = location;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        location: user.location,
        onboardingCompleted: user.onboardingCompleted,
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔐 CHANGE PASSWORD CONTROLLER (for logged-in users)
export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Current password and new password are required." 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "New password must be at least 8 characters long and include uppercase, lowercase, digit, and special character.",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log(`Password changed successfully for user: ${user.email}`);

    return res.json({
      success: true,
      message: "Password changed successfully."
    });

  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ 
      message: "Server error. Please try again later." 
    });
  }
};