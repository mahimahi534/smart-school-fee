import { prisma } from '../prisma.js';

export const getNotifications = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      return res.json({ success: true, data: [] });
    }

    const notifications = await prisma.inAppNotification.findMany({
      where: {
        schoolId,
        OR: [{ userId: req.user.id }, { userId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await prisma.inAppNotification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
