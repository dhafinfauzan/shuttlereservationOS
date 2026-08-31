import { prisma } from '../../lib/prisma.js';
import { ActivityType } from '../../config/constants.js';

export class ActivityService {
  static async log(
    params: {
      type: ActivityType | string;
      title: string;
      description: string;
      metadata?: Record<string, any>;
      userId?: string;
    },
    client?: any
  ) {
    try {
      const db = client || prisma;
      return await db.activityLog.create({
        data: {
          type: params.type,
          title: params.title,
          description: params.description,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
          userId: params.userId,
        },
      });
    } catch (err) {
      console.error('[ACTIVITY_LOG_ERROR]', err);
    }
  }

  static async getRecent(limit = 10) {
    const logs = await prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      type: log.type,
      title: log.title,
      detail: log.description,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      createdAt: log.createdAt,
      timeAgo: getTimeAgo(log.createdAt),
      user: log.user,
    }));
  }
}

function getTimeAgo(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} mnt`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam`;
  const days = Math.floor(hours / 24);
  return `${days} hari`;
}
