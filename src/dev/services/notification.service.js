import { toast } from 'react-toastify';
import { injectable } from '../injectable';

export const createNotificationService = injectable.constant(() => ({
  warn: (text) => toast.warn(text),
}));

export const injectNotificationService = () => injectable.inject.constant()('notificationService');
