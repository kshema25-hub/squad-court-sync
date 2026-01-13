import { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { pendingBookings, PendingBooking } from '@/lib/admin-data';
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
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminApprovals = () => {
  const [bookings, setBookings] = useState(pendingBookings);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'court' | 'equipment'>('all');

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.courtName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.equipmentName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || booking.type === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = filteredBookings.filter(b => b.status === 'pending').length;
  const approvedCount = filteredBookings.filter(b => b.status === 'approved').length;
  const rejectedCount = filteredBookings.filter(b => b.status === 'rejected').length;

  const handleApprove = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'approved' as const } : b));
    toast.success('Booking approved!');
  };

  const handleReject = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' as const } : b));
    toast.error('Booking rejected');
  };

  const handleApproveAll = () => {
    setBookings(prev => prev.map(b => b.status === 'pending' ? { ...b, status: 'approved' as const } : b));
    toast.success('All pending bookings approved!');
  };

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
          <Button variant="accent" onClick={handleApproveAll}>
            <CheckCircle className="w-4 h-4 mr-2" />
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
  booking: PendingBooking;
  index: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const BookingApprovalCard = ({ booking, index, onApprove, onReject }: BookingApprovalCardProps) => {
  const statusColors = {
    pending: 'bg-warning/20 text-warning border-warning/30',
    approved: 'bg-success/20 text-success border-success/30',
    rejected: 'bg-destructive/20 text-destructive border-destructive/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gradient-card rounded-xl p-5 border border-border"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${booking.type === 'court' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
            {booking.type === 'court' ? <Calendar className="w-6 h-6" /> : <Package className="w-6 h-6" />}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-display font-semibold text-foreground">
                {booking.courtName || booking.equipmentName}
              </h4>
              <Badge className={statusColors[booking.status]}>
                {booking.status}
              </Badge>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                {booking.userName}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {booking.userClass}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {booking.date}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {booking.startTime} - {booking.endTime}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {booking.bookingType === 'class' ? 'Class Booking' : 'Individual'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Requested: {booking.requestedAt}
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
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button 
              variant="hero"
              onClick={() => onApprove(booking.id)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminApprovals;
