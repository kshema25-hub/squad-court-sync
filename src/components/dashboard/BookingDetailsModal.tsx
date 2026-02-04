import { useState } from 'react';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Package,
  FileText,
  History,
  CheckCircle2,
  XCircle,
  Clock4,
  AlertCircle,
  Loader2,
  User,
  Ticket,
} from 'lucide-react';
import { useBookingHistory, StatusHistoryEntry } from '@/hooks/useBookingHistory';
import { useCancelBooking } from '@/hooks/useBookingMutations';
import { useAuth } from '@/hooks/useAuth';
import { BookingPassModal } from '@/components/booking/BookingPassModal';
import type { Booking } from '@/hooks/useBookings';

interface BookingDetailsModalProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: <Clock4 className="w-4 h-4" />,
    label: 'Pending',
  },
  approved: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: 'Approved',
  },
  rejected: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: <XCircle className="w-4 h-4" />,
    label: 'Rejected',
  },
  cancelled: {
    color: 'bg-muted text-muted-foreground',
    icon: <XCircle className="w-4 h-4" />,
    label: 'Cancelled',
  },
  completed: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: 'Completed',
  },
};

function getStatusConfig(status: string) {
  return statusConfig[status] || {
    color: 'bg-muted text-muted-foreground',
    icon: <AlertCircle className="w-4 h-4" />,
    label: status,
  };
}

function formatDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const hours = differenceInHours(end, start);
  const minutes = differenceInMinutes(end, start) % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function StatusHistoryTimeline({ history, isLoading }: { history: StatusHistoryEntry[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No status history available
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => {
        const config = getStatusConfig(entry.new_status);
        const isFirst = index === 0;

        return (
          <div key={entry.id} className="relative pl-6">
            {/* Timeline line */}
            {index < history.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
            )}

            {/* Timeline dot */}
            <div
              className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${config.color}`}
            >
              {config.icon}
            </div>

            {/* Content */}
            <div className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  {isFirst ? 'Created' : `Changed to ${config.label}`}
                </span>
                {!isFirst && entry.old_status && (
                  <span className="text-xs text-muted-foreground">
                    from {getStatusConfig(entry.old_status).label}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(entry.changed_at), 'MMM d, yyyy')} at{' '}
                {format(new Date(entry.changed_at), 'h:mm a')}
              </p>
              {entry.changed_by_profile && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <User className="w-3 h-3" />
                  {entry.changed_by_profile.full_name}
                </p>
              )}
              {entry.notes && (
                <p className="text-sm mt-2 text-foreground bg-muted/50 rounded-md p-2">
                  {entry.notes}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BookingDetailsModal({ booking, open, onOpenChange }: BookingDetailsModalProps) {
  const [showPassModal, setShowPassModal] = useState(false);
  const { data: history = [], isLoading: historyLoading } = useBookingHistory(booking?.id);
  const cancelBooking = useCancelBooking();
  const { profile } = useAuth();

  if (!booking) return null;

  const resourceName =
    booking.court?.name || booking.equipment?.name || booking.class?.name || 'Unknown Resource';
  const location = booking.court?.location || 'N/A';
  const statusInfo = getStatusConfig(booking.status);
  
  // Find when booking was approved from history
  const approvalEntry = history.find(h => h.new_status === 'approved');
  const approvedAt = approvalEntry?.changed_at;

  const handleCancel = () => {
    cancelBooking.mutate(booking.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {booking.resource_type === 'court' ? (
                  <MapPin className="w-5 h-5 text-primary" />
                ) : (
                  <Package className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg">{resourceName}</DialogTitle>
                <DialogDescription className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {location}
                </DialogDescription>
              </div>
            </div>
            <Badge className={`${statusInfo.color} flex items-center gap-1`}>
              {statusInfo.icon}
              {statusInfo.label}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4">
            {/* Date & Time Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">
                    {format(new Date(booking.start_time), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm font-medium">
                    {format(new Date(booking.start_time), 'h:mm a')} -{' '}
                    {format(new Date(booking.end_time), 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Clock4 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">
                    {formatDuration(booking.start_time, booking.end_time)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium capitalize">{booking.booking_type}</p>
                </div>
              </div>
            </div>

            {/* Quantity for equipment */}
            {booking.resource_type === 'equipment' && booking.quantity && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Package className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="text-sm font-medium">{booking.quantity}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {booking.notes && (
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Notes</p>
                </div>
                <p className="text-sm">{booking.notes}</p>
              </div>
            )}

            <Separator />

            {/* Metadata */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                <span className="font-medium">Booking ID:</span> {booking.id.slice(0, 8)}...
              </p>
              <p>
                <span className="font-medium">Created:</span>{' '}
                {format(new Date(booking.created_at), 'MMM d, yyyy')} at{' '}
                {format(new Date(booking.created_at), 'h:mm a')}
              </p>
              <p>
                <span className="font-medium">Last Updated:</span>{' '}
                {format(new Date(booking.updated_at), 'MMM d, yyyy')} at{' '}
                {format(new Date(booking.updated_at), 'h:mm a')}
              </p>
            </div>

            <Separator />

            {/* Status History */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Status History</h4>
              </div>
              <StatusHistoryTimeline history={history} isLoading={historyLoading} />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {booking.status === 'approved' && (
            <Button
              variant="hero"
              onClick={() => setShowPassModal(true)}
            >
              <Ticket className="w-4 h-4 mr-2" />
              View Pass
            </Button>
          )}
          {booking.status === 'pending' && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelBooking.isPending}
            >
              {cancelBooking.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cancel Booking
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Booking Pass Modal */}
      <BookingPassModal
        open={showPassModal}
        onOpenChange={setShowPassModal}
        booking={booking}
        userName={profile?.full_name || 'Unknown'}
        approvedAt={approvedAt}
      />
    </Dialog>
  );
}
