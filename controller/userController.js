import User from "../model/userModel.js";
import jwt from 'jsonwebtoken';
import { sendOTPEmail } from "../utils/sendOTPEmail.js";
import { generateOTP } from "../utils/generateOTP.js";

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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Generate OTP and expiry
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Create new user
    const user = await User.create({
      name,
      email,
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
    console.log("User found in DB:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
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

export const getUser = async (req, res) => {
  try {
    const userId = req.user._id; 

    const user = await User.findById(userId).select('-password'); // Exclude password

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



export const completeOnboarding = async (req, res) => {
  try {
    const userId = req.user.id; 

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.onboardingCompleted = true;
    await user.save();

    res.status(200).json({ message: 'Onboarding marked as complete', user });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE ACCOUNT CONTROLLER
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id; // or req.user.id depending on your middleware

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
