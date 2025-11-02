import { writable } from 'svelte/store';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number; // Auto-dismiss after this many ms (0 = no auto-dismiss)
    action?: {
        label: string;
        handler: () => void;
    };
    dismissible?: boolean;
}

interface NotificationStore {
    notifications: Notification[];
}

function createNotificationStore() {
    const { subscribe, update } = writable<NotificationStore>({ notifications: [] });

    return {
        subscribe,

        /**
         * Add a new notification
         */
        add: (notification: Omit<Notification, 'id'>) => {
            const id = crypto.randomUUID();
            const newNotification: Notification = {
                id,
                duration: 5000, // Default 5 seconds
                dismissible: true,
                ...notification
            };

            update(store => ({
                notifications: [...store.notifications, newNotification]
            }));

            // Auto-dismiss if duration is set
            if (newNotification.duration && newNotification.duration > 0) {
                setTimeout(() => {
                    notifications.dismiss(id);
                }, newNotification.duration);
            }

            return id;
        },

        /**
         * Remove a notification by ID
         */
        dismiss: (id: string) => {
            update(store => ({
                notifications: store.notifications.filter(n => n.id !== id)
            }));
        },

        /**
         * Clear all notifications
         */
        clear: () => {
            update(() => ({ notifications: [] }));
        },

        /**
         * Convenience methods for different notification types
         */
        success: (title: string, message: string, options?: Partial<Notification>) => {
            return notifications.add({ type: 'success', title, message, ...options });
        },

        error: (title: string, message: string, options?: Partial<Notification>) => {
            return notifications.add({
                type: 'error',
                title,
                message,
                duration: 0, // Errors don't auto-dismiss by default
                ...options
            });
        },

        warning: (title: string, message: string, options?: Partial<Notification>) => {
            return notifications.add({ type: 'warning', title, message, ...options });
        },

        info: (title: string, message: string, options?: Partial<Notification>) => {
            return notifications.add({ type: 'info', title, message, ...options });
        }
    };
}

export const notifications = createNotificationStore();