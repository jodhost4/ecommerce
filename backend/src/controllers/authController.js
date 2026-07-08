const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateTokens, verifyRefreshToken, generateResetToken, generateVerificationToken } = require('../services/tokenService');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../services/emailService');
const { ApiError } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/ApiResponse');
const { sanitizeUser } = require('../utils/helpers');

const authController = {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone, role = 'CUSTOMER' } = req.body;

      // Prevent unauthorized SUPER_ADMIN registration
      const targetRole = role === 'SUPER_ADMIN' ? 'CUSTOMER' : (role || 'CUSTOMER');

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new ApiError(409, 'Email already registered');
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      
      const roleRecord = await prisma.role.findUnique({ 
        where: { name: targetRole.toUpperCase() } 
      });

      if (!roleRecord) {
        throw new ApiError(400, 'Invalid registration role');
      }

      const verificationToken = generateVerificationToken();

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          roleId: roleRecord.id,
          verificationToken,
          isActive: true,
        },
        include: { role: true },
      });

      await sendVerificationEmail(email, verificationToken).catch(() => {});
      await sendWelcomeEmail(email, firstName).catch(() => {});

      const { token, refreshToken } = generateTokens(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      ApiResponse.created(res, {
        user: sanitizeUser(user),
        token,
        refreshToken,
      }, 'Registration successful. Please verify your email.');
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          role: true,
          ownedStore: {
            select: { id: true, name: true, slug: true, isActive: true },
          },
        },
      });

      if (!user) {
        throw new ApiError(401, 'Invalid email or password');
      }

      if (!user.isActive) {
        throw new ApiError(401, 'Account is deactivated');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
      }

      const { token, refreshToken } = generateTokens(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken, lastLoginAt: new Date() },
      });

      ApiResponse.success(res, {
        user: sanitizeUser(user),
        token,
        refreshToken,
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      if (req.user) {
        await prisma.user.update({
          where: { id: req.user.id },
          data: { refreshToken: null },
        });
      }
      ApiResponse.success(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
      }

      let decoded;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch {
        throw new ApiError(401, 'Invalid or expired refresh token');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true },
      });

      if (!user || !user.isActive || user.refreshToken !== refreshToken) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      const tokens = generateTokens(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      ApiResponse.success(res, {
        token: tokens.token,
        refreshToken: tokens.refreshToken,
      }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return ApiResponse.success(res, null, 'If the email exists, a reset link has been sent');
      }

      const resetToken = generateResetToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
        },
      });

      await sendPasswordResetEmail(email, resetToken).catch(() => {});

      ApiResponse.success(res, null, 'If the email exists, a reset link has been sent');
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { gt: new Date() },
        },
      });

      if (!user) {
        throw new ApiError(400, 'Invalid or expired reset token');
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          refreshToken: null,
        },
      });

      ApiResponse.success(res, null, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;

      const user = await prisma.user.findFirst({
        where: { verificationToken: token },
      });

      if (!user) {
        throw new ApiError(400, 'Invalid verification token');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          verificationToken: null,
        },
      });

      ApiResponse.success(res, null, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          role: true,
          ownedStore: {
            select: { id: true, name: true, slug: true, isActive: true },
          },
        },
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      ApiResponse.success(res, sanitizeUser(user));
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone, avatar } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { firstName, lastName, phone, avatar },
        include: { role: true },
      });

      ApiResponse.success(res, sanitizeUser(user), 'Profile updated');
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new ApiError(400, 'Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          refreshToken: null,
        },
      });

      ApiResponse.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
