import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';

// Helper to determine mapped role for Google sign-in
const getMappedRoleByEmail = (email) => {
  const normalizedEmail = (email || '').toLowerCase().trim();
  
  // List of designated Admin (Government / Auditor) and Agent accounts
  const ADMIN_EMAILS = [
    'abinashregmi01234@gmail.com',
    'admin@civicestate.gov.np',
  ];

  const AGENT_EMAILS = [
    'agent@civicestate.com',
  ];

  if (ADMIN_EMAILS.includes(normalizedEmail)) {
    return 'admin';
  }
  if (AGENT_EMAILS.includes(normalizedEmail)) {
    return 'agent';
  }
  return 'user';
};

export const signup = async (req, res, next) => {
  const { username, email, password, role } = req.body;

  // Ensure role is a valid enum value, fallback to 'user'
  const validRoles = ['user', 'agent', 'admin'];
  const userRole = validRoles.includes(role) ? role : 'user';

  const hashedPassword = bcryptjs.hashSync(password, 10);
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    role: userRole,
  });

  try {
    await newUser.save();
    res.status(201).json({
      success: true,
      message: 'User created successfully!',
    });
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const validUser = await User.findOne({ email });
    if (!validUser) {
      return next(errorHandler(404, 'User not found!'));
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return next(errorHandler(401, 'Wrong credentials!'));
    }

    // JWT Payload containing both user ID and Role
    const token = jwt.sign(
      { id: validUser._id, role: validUser.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: pass, ...rest } = validUser._doc;

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  try {
    const { email, name, photo } = req.body;
    let user = await User.findOne({ email });

    const designatedRole = getMappedRoleByEmail(email);

    if (user) {
      // If user is designated as admin/agent by email but has standard 'user' in DB, update role
      if (designatedRole !== 'user' && user.role !== designatedRole) {
        user.role = designatedRole;
        await user.save();
      }

      const token = jwt.sign(
        { id: user._id, role: user.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password, ...rest } = user._doc;

      return res
        .cookie('access_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        })
        .status(200)
        .json(rest);
    } else {
      // Generate secure random password for new Google OAuth user
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);

      const sanitizedUsername =
        (name || 'user').split(' ').join('').toLowerCase() +
        Math.random().toString(36).slice(-4);

      const newUser = new User({
        username: sanitizedUsername,
        email,
        password: hashedPassword,
        avatar: photo || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
        role: designatedRole,
      });

      await newUser.save();

      const token = jwt.sign(
        { id: newUser._id, role: newUser.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password, ...rest } = newUser._doc;

      return res
        .cookie('access_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        })
        .status(200)
        .json(rest);
    }
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    // Clear the JWT httpOnly cookie
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.status(200).json({
      success: true,
      message: 'User has been successfully signed out!',
    });
  } catch (error) {
    next(error);
  }
};