import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Booking } from '@/hooks/useBookings';
import { format } from 'date-fns';
import { useCancelBooking } from '@/hooks/useBookingMutations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BookingCardProps {
  booking: Booking;
  index: number;
}

export const BookingCard = ({ booking, index }: BookingCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const cancelBooking = useCancelBooking();

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/20 text-warning border-warning/30',
    approved: 'bg-success/20 text-success border-success/30',
    rejected: 'bg-destructive/20 text-destructive border-destructive/30',
    completed: 'bg-muted text-muted-foreground border-border',
    cancelled: 'bg-muted text-muted-foreground border-border',
  };

  const resourceName = booking.resource_type === 'court' 
    ? booking.court?.name 
    : booking.equipment?.name;
    
  const location = booking.resource_type === 'court'
    ? booking.court?.location
    : 'Sports Complex';

  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);

  const handleCancelBooking = () => {
    cancelBooking.mutate(booking.id, {
      onSuccess: () => {
        setIsDialogOpen(false);
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gradient-card rounded-xl p-5 border border-border hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            booking.resource_type === 'court' ? 'bg-primary/10' : 'bg-accent/10'
          }`}>
            {booking.resource_type === 'court' ? (
              <Calendar className="w-5 h-5 text-primary" />
            ) : (
              <Package className="w-5 h-5 text-accent" />
            )}
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-1">
              {resourceName || 'Booking'}
            </h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {location || 'Sports Complex'}
            </div>
          </div>
        </div>
        <Badge className={statusColors[booking.status] || statusColors.pending}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-foreground">{format(startTime, 'MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-foreground">
            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {booking.booking_type === 'class' && booking.class 
              ? booking.class.class_id 
              : 'Individual'}
          </span>
          {booking.quantity && booking.quantity > 1 && (
            <Badge variant="outline" className="ml-2">
              Qty: {booking.quantity}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {booking.status === 'pending' && (
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this booking for{' '}
                    <span className="font-medium text-foreground">{resourceName}</span> on{' '}
                    <span className="font-medium text-foreground">{format(startTime, 'MMM d, yyyy')}</span>?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelBooking}
                    disabled={cancelBooking.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {cancelBooking.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Booking'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
