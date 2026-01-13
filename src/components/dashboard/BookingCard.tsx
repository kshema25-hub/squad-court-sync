import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Booking, courts } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BookingCardProps {
  booking: Booking;
  index: number;
}

export const BookingCard = ({ booking, index }: BookingCardProps) => {
  const court = courts.find((c) => c.id === booking.courtId);

  const statusColors = {
    pending: 'bg-warning/20 text-warning border-warning/30',
    approved: 'bg-success/20 text-success border-success/30',
    rejected: 'bg-destructive/20 text-destructive border-destructive/30',
    completed: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gradient-card rounded-xl p-5 border border-border hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-display font-semibold text-foreground mb-1">
            {court?.name || 'Equipment Booking'}
          </h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            {court?.location || 'Sports Complex'}
          </div>
        </div>
        <Badge className={statusColors[booking.status]}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-foreground">{booking.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-foreground">
            {booking.startTime} - {booking.endTime}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {booking.type === 'class' ? booking.classId : 'Individual'}
          </span>
        </div>
        <div className="flex gap-2">
          {booking.status === 'pending' && (
            <Button variant="ghost" size="sm" className="text-destructive">
              Cancel
            </Button>
          )}
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
