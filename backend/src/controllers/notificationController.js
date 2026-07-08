const prisma = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/ApiResponse');
const { calculatePagination, getPaginationMeta } = require('../utils/helpers');

const notificationController = {
  async getNotifications(req, res, next) {
    try {
      const { page, limit, type, isRead } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = { userId: req.user.id };
      if (type) where.type = type;
      if (isRead !== undefined) where.isRead = isRead === 'true';

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
      ]);

      ApiResponse.paginated(res, notifications, getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await prisma.notification.findFirst({
        where: { id, userId: req.user.id },
      });
      if (!notification) throw new ApiError(404, 'Notification not found');

      await prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
      ApiResponse.success(res, null, 'Marked as read');
    } catch (error) {
      next(error);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      ApiResponse.success(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  },

  async getPreferences(req, res, next) {
    try {
      let prefs = await prisma.subscription.findUnique({
        where: { userId: req.user.id },
      });
      if (!prefs) {
        prefs = await prisma.subscription.create({
          data: { userId: req.user.id },
        });
      }
      ApiResponse.success(res, prefs);
    } catch (error) {
      next(error);
    }
  },

  async updatePreferences(req, res, next) {
    try {
      const allowedFields = ['emailEnabled', 'smsEnabled', 'pushEnabled', 'orderUpdates', 'paymentUpdates', 'promotional'];
      const data = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) data[field] = req.body[field];
      }

      const prefs = await prisma.subscription.upsert({
        where: { userId: req.user.id },
        create: { userId: req.user.id, ...data },
        update: data,
      });
      ApiResponse.success(res, prefs, 'Preferences updated');
    } catch (error) {
      next(error);
    }
  },

  async sendTestNotification(req, res, next) {
    try {
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          type: 'ACCOUNT_UPDATE',
          channel: 'INAPP',
          title: 'Test Notification',
          message: 'This is a test notification to verify your notification settings.',
        },
      });
      ApiResponse.success(res, null, 'Test notification sent');
    } catch (error) {
      next(error);
    }
  },

  async createNotification(req, res, next) {
    try {
      const { userIds, type, title, message } = req.body;
      if (!userIds || !userIds.length || !title || !message) {
        throw new ApiError(400, 'User IDs, title, and message are required');
      }

      const data = userIds.map((userId) => ({
        userId,
        type: type || 'ACCOUNT_UPDATE',
        channel: 'INAPP',
        title,
        message,
      }));

      await prisma.notification.createMany({ data });
      ApiResponse.created(res, null, `Notification sent to ${userIds.length} users`);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = notificationController;
