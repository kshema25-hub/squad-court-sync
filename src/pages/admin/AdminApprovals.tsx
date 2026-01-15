import { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  useAllPendingBookings, 
  useApproveBooking, 
  useRejectBooking, 
  useBulkApproveBookings,
  AdminBooking 
} from '@/hooks/useAdminBookings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Package, 
  Search, 
  CheckCircle, 
  XCircle,
  Clock,
  Users,
  Filter,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

const AdminApprovals = () => {
  const { data: bookings = [], isLoading } = useAllPendingBookings();
  const approveBooking = useApproveBooking();
  const rejectBooking = useRejectBooking();
  const bulkApprove = useBulkApproveBookings();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'court' | 'equipment'>('all');

  const filteredBookings = bookings.filter((booking) => {
    const userName = booking.profile?.full_name || '';
    const courtName = booking.court?.name || '';
    const equipmentName = booking.equipment?.name || '';
    
    const matchesSearch =
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipmentName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'court' && booking.resource_type === 'court') ||
      (filter === 'equipment' && booking.resource_type === 'equipment');
    
    return matchesSearch && matchesFilter;
  });

  const pendingCount = filteredBookings.filter(b => b.status === 'pending').length;
  const approvedCount = filteredBookings.filter(b => b.status === 'approved').length;
  const rejectedCount = filteredBookings.filter(b => b.status === 'rejected').length;

  const handleApprove = (id: string) => {
    approveBooking.mutate(id);
  };

  const handleReject = (id: string) => {
    rejectBooking.mutate(id);
  };

  const handleApproveAll = () => {
    const pendingIds = filteredBookings
      .filter(b => b.status === 'pending')
      .map(b => b.id);
    bulkApprove.mutate(pendingIds);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Booking Approvals" subtitle="Loading...">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Booking Approvals"
      subtitle={`${pendingCount} pending, ${approvedCount} approved, ${rejectedCount} rejected`}
    >
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or facility..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'hero' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'court' ? 'hero' : 'outline'}
            size="sm"
            onClick={() => setFilter('court')}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Courts
          </Button>
          <Button
            variant={filter === 'equipment' ? 'hero' : 'outline'}
            size="sm"
            onClick={() => setFilter('equipment')}
          >
            <Package className="w-4 h-4 mr-1" />
            Equipment
          </Button>
        </div>

        {pendingCount > 0 && (
          <Button 
            variant="accent" 
            onClick={handleApproveAll}
            disabled={bulkApprove.isPending}
          >
            {bulkApprove.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Approve All Pending
          </Button>
        )}
      </motion.div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-secondary mb-6">
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingCount > 0 && (
              <Badge className="bg-warning/20 text-warning text-xs">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'rejected'].map((status) => (
          <TabsContent key={status} value={status}>
            <div className="space-y-3">
              {filteredBookings.filter(b => b.status === status).length > 0 ? (
                filteredBookings
                  .filter(b => b.status === status)
                  .map((booking, index) => (
                    <BookingApprovalCard
                      key={booking.id}
                      booking={booking}
                      index={index}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      isApproving={approveBooking.isPending}
                      isRejecting={rejectBooking.isPending}
                    />
                  ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gradient-card rounded-xl p-12 border border-border text-center"
                >
                  <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    No {status} bookings
                  </h3>
                  <p className="text-muted-foreground">
                    {status === 'pending' 
                      ? 'All booking requests have been processed.'
                      : `No ${status} bookings match your filters.`
                    }
                  </p>
                </motion.div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </AdminLayout>
  );
};

interface BookingApprovalCardProps {
  booking: AdminBooking;
  index: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

const BookingApprovalCard = ({ 
  booking, 
  index, 
  onApprove, 
  onReject,
  isApproving,
  isRejecting 
}: BookingApprovalCardProps) => {
  const statusColors = {
    pending: 'bg-warning/20 text-warning border-warning/30',
    approved: 'bg-success/20 text-success border-success/30',
    rejected: 'bg-destructive/20 text-destructive border-destructive/30',
    completed: 'bg-muted/20 text-muted-foreground border-muted/30',
    cancelled: 'bg-muted/20 text-muted-foreground border-muted/30',
  };

  const resourceName = booking.court?.name || booking.equipment?.name || 'Unknown';
  const userName = booking.profile?.full_name || 'Unknown User';
  const userClass = booking.class?.name || 'Individual';
  const bookingDate = format(new Date(booking.start_time), 'MMM dd, yyyy');
  const startTime = format(new Date(booking.start_time), 'h:mm a');
  const endTime = format(new Date(booking.end_time), 'h:mm a');
  const requestedAt = format(new Date(booking.created_at), 'MMM dd, h:mm a');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gradient-card rounded-xl p-5 border border-border"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${booking.resource_type === 'court' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
            {booking.resource_type === 'court' ? <Calendar className="w-6 h-6" /> : <Package className="w-6 h-6" />}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-display font-semibold text-foreground">
                {resourceName}
              </h4>
              <Badge className={statusColors[booking.status as keyof typeof statusColors] || statusColors.pending}>
                {booking.status}
              </Badge>
              {booking.quantity && booking.quantity > 1 && (
                <Badge variant="secondary" className="text-xs">
                  ×{booking.quantity}
                </Badge>
              )}
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                {userName}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {userClass}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {bookingDate}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {startTime} - {endTime}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {booking.booking_type === 'class' ? 'Class Booking' : 'Individual'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Requested: {requestedAt}
              </span>
            </div>
          </div>
        </div>

        {booking.status === 'pending' && (
          <div className="flex gap-2 shrink-0">
            <Button 
              variant="outline" 
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => onReject(booking.id)}
              disabled={isRejecting}
            >
              {isRejecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject
            </Button>
            <Button 
              variant="hero"
              onClick={() => onApprove(booking.id)}
              disabled={isApproving}
            >
              {isApproving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminApprovals;
