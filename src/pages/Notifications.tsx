import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Calendar, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Trash2,
  CheckCheck
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'booking' | 'equipment' | 'reminder' | 'penalty' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'booking',
    title: 'Booking Approved',
    message: 'Your booking for Indoor Basketball Court A on Jan 15 has been approved.',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Upcoming Booking',
    message: 'Reminder: You have a court booking tomorrow at 2:00 PM.',
    time: '5 hours ago',
    read: false,
  },
  {
    id: '3',
    type: 'equipment',
    title: 'Equipment Due Soon',
    message: 'Tennis Racket is due for return in 2 hours. Please return on time to avoid penalties.',
    time: '1 day ago',
    read: true,
  },
  {
    id: '4',
    type: 'system',
    title: 'New Court Available',
    message: 'A new Squash Court has been added to the Sports Complex. Book now!',
    time: '2 days ago',
    read: true,
  },
  {
    id: '5',
    type: 'penalty',
    title: 'Penalty Cleared',
    message: 'Your pending penalty of ₹50 has been cleared. Thank you!',
    time: '3 days ago',
    read: true,
  },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return Calendar;
      case 'equipment':
        return Package;
      case 'reminder':
        return Clock;
      case 'penalty':
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'text-primary bg-primary/10';
      case 'equipment':
        return 'text-accent bg-accent/10';
      case 'reminder':
        return 'text-info bg-info/10';
      case 'penalty':
        return 'text-warning bg-warning/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <DashboardLayout
      title="Notifications"
      subtitle={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
    >
      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 mb-6"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="w-4 h-4 mr-2" />
          Mark All Read
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          disabled={notifications.length === 0}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </motion.div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification, index) => {
            const Icon = getIcon(notification.type);
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  bg-gradient-card rounded-xl p-4 border transition-all duration-300 cursor-pointer
                  ${notification.read ? 'border-border' : 'border-primary/30 bg-primary/5'}
                `}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconColor(notification.type)}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{notification.title}</h4>
                      <div className="flex items-center gap-2 shrink-0">
                        {!notification.read && (
                          <Badge className="bg-primary/20 text-primary border-0 text-xs">
                            New
                          </Badge>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-card rounded-xl p-12 border border-border text-center"
          >
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              All Caught Up!
            </h3>
            <p className="text-muted-foreground">
              You have no notifications at the moment.
            </p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
