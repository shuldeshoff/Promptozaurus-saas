import prisma from '../lib/prisma.js';
import { ProjectShare } from '@prisma/client';

interface CreateProjectShareInput {
  projectId: string;
  ownerId: string;
  sharedWithEmail: string;
  permission: 'view' | 'edit';
}

interface UpdateProjectShareInput {
  permission?: 'view' | 'edit';
  status?: 'pending' | 'accepted' | 'rejected';
}

class ProjectShareService {
  /**
   * Создать новый share (приглашение)
   */
  async createShare(input: CreateProjectShareInput): Promise<ProjectShare> {
    // Проверка: нельзя расшарить проект самому себе
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: { userId: true, user: { select: { email: true } } },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.user.email === input.sharedWithEmail) {
      throw new Error('Cannot share project with yourself');
    }

    // Проверка: share уже существует
    const existing = await prisma.projectShare.findUnique({
      where: {
        projectId_sharedWithEmail: {
          projectId: input.projectId,
          sharedWithEmail: input.sharedWithEmail,
        },
      },
    });

    if (existing) {
      throw new Error('Project already shared with this email');
    }

    return await prisma.projectShare.create({
      data: {
        projectId: input.projectId,
        ownerId: input.ownerId,
        sharedWithEmail: input.sharedWithEmail,
        permission: input.permission,
        status: 'pending',
      },
    });
  }

  /**
   * Получить все shares для проекта (только для владельца)
   */
  async getProjectShares(projectId: string, userId: string): Promise<ProjectShare[]> {
    // Проверка владельца
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project || project.userId !== userId) {
      throw new Error('Project not found or access denied');
    }

    return await prisma.projectShare.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Получить все shares, где пользователь является sharedWith
   */
  async getUserSharedProjects(userEmail: string): Promise<ProjectShare[]> {
    return await prisma.projectShare.findMany({
      where: { sharedWithEmail: userEmail },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Обновить share (изменить permission или status)
   */
  async updateShare(
    shareId: string,
    userId: string,
    input: UpdateProjectShareInput
  ): Promise<ProjectShare> {
    const share = await prisma.projectShare.findUnique({
      where: { id: shareId },
      include: { project: { select: { userId: true } } },
    });

    if (!share) {
      throw new Error('Share not found');
    }

    // Только владелец может менять permission
    if (input.permission && share.project.userId !== userId) {
      throw new Error('Only project owner can change permissions');
    }

    // Получатель может принять/отклонить
    // (для упрощения, в будущем можно добавить проверку email)

    return await prisma.projectShare.update({
      where: { id: shareId },
      data: input,
    });
  }

  /**
   * Удалить share
   */
  async deleteShare(shareId: string, userId: string): Promise<void> {
    const share = await prisma.projectShare.findUnique({
      where: { id: shareId },
      include: { project: { select: { userId: true } } },
    });

    if (!share) {
      throw new Error('Share not found');
    }

    // Только владелец может удалять shares
    if (share.project.userId !== userId) {
      throw new Error('Only project owner can delete shares');
    }

    await prisma.projectShare.delete({
      where: { id: shareId },
    });
  }

  /**
   * Проверка доступа пользователя к проекту
   */
  async checkAccess(
    projectId: string,
    userId: string,
    userEmail: string
  ): Promise<{ hasAccess: boolean; permission: 'owner' | 'view' | 'edit' }> {
    // Проверка владельца
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      return { hasAccess: false, permission: 'view' };
    }

    if (project.userId === userId) {
      return { hasAccess: true, permission: 'owner' };
    }

    // Проверка share
    const share = await prisma.projectShare.findUnique({
      where: {
        projectId_sharedWithEmail: {
          projectId,
          sharedWithEmail: userEmail,
        },
      },
    });

    if (share && share.status === 'accepted') {
      return {
        hasAccess: true,
        permission: share.permission as 'view' | 'edit',
      };
    }

    return { hasAccess: false, permission: 'view' };
  }
}

export const projectShareService = new ProjectShareService();

