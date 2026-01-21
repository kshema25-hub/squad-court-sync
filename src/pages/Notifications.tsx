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
  CheckCheck,
  Loader2,
  Info,
  XCircle
} from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return XCircle;
      case 'warning':
        return AlertTriangle;
      case 'booking':
        return Calendar;
      case 'equipment':
        return Package;
      case 'reminder':
        return Clock;
      case 'info':
        return Info;
      default:
        return Bell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-success bg-success/10';
      case 'error':
        return 'text-destructive bg-destructive/10';
      case 'warning':
        return 'text-warning bg-warning/10';
      case 'booking':
        return 'text-primary bg-primary/10';
      case 'equipment':
        return 'text-accent bg-accent/10';
      case 'reminder':
        return 'text-info bg-info/10';
      case 'info':
        return 'text-info bg-info/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const handleMarkAsRead = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Notifications" subtitle="Loading...">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

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
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0 || markAllAsRead.isPending}
        >
          {markAllAsRead.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCheck className="w-4 h-4 mr-2" />
          )}
          Mark All Read
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
                  ${notification.is_read ? 'border-border' : 'border-primary/30 bg-primary/5'}
                `}
                onClick={() => handleMarkAsRead(notification)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconColor(notification.type)}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{notification.title}</h4>
                      <div className="flex items-center gap-2 shrink-0">
                        {!notification.is_read && (
                          <Badge className="bg-primary/20 text-primary border-0 text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(notification.created_at)}
                    </span>
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
