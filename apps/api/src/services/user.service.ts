import prisma from '../lib/prisma.js';
import { User } from '@prisma/client';

interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface CreateUserData {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  language?: string;
}

interface UpdateUserData {
  name?: string;
  language?: 'en' | 'ru';
  theme?: 'dark' | 'light';
}

class UserService {
  /**
   * Find user by Google ID
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { googleId },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Create new user from Google profile
   */
  async createFromGoogle(profile: GoogleProfile, language?: string): Promise<User> {
    const userData: CreateUserData = {
      googleId: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
      language: language || 'en',
    };

    return await prisma.user.create({
      data: userData,
    });
  }

  /**
   * Find or create user from Google OAuth
   */
  async findOrCreateFromGoogle(profile: GoogleProfile, language?: string): Promise<User> {
    // Try to find existing user
    let user = await this.findByGoogleId(profile.id);

    if (!user) {
      // Check if user exists by email (migration case)
      user = await this.findByEmail(profile.email);

      if (user) {
        // Update Google ID
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.id },
        });
      } else {
        // Create new user
        user = await this.createFromGoogle(profile, language);
      }
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateUserData): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Get user's project count
   */
  async getProjectCount(userId: string): Promise<number> {
    return await prisma.project.count({
      where: { userId },
    });
  }

  /**
   * Check if user can create more projects (free plan limit)
   */
  async canCreateProject(userId: string): Promise<boolean> {
    const count = await this.getProjectCount(userId);
    const limit = 10; // Free plan limit
    return count < limit;
  }

  /**
   * Delete user and all related data
   */
  async deleteUser(userId: string): Promise<void> {
    // Prisma cascade delete will handle related records
    await prisma.user.delete({
      where: { id: userId },
    });
  }
}

export const userService = new UserService();

