import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Users,
  Calendar,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { useAllPendingBookings, useApproveBooking, useRejectBooking } from '@/hooks/useAdminBookings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/hooks/useAuth';

const AdminDashboard = () => {
  const { loading: authLoading } = useAuth();
  const { data: bookings = [], isLoading: bookingsLoading } = useAllPendingBookings();
  const approveBooking = useApproveBooking();
  const rejectBooking = useRejectBooking();

  // Fetch real stats from database
  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const [profilesRes, classesRes, equipmentRes, courtsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('classes').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('equipment').select('id, total_quantity, available_quantity'),
        supabase.from('courts').select('id', { count: 'exact' }),
      ]);

      const totalUsers = profilesRes.count || 0;
      const totalClasses = classesRes.count || 0;
      const totalCourts = courtsRes.count || 0;

      const equipmentData = equipmentRes.data || [];
      const equipmentIssued = equipmentData.reduce(
        (acc, item) => acc + (item.total_quantity - item.available_quantity),
        0
      );
      const lowStockItems = equipmentData.filter((item) => item.available_quantity < 3).length;

      return { totalUsers, totalClasses, equipmentIssued, totalCourts, lowStockItems };
    },
  });

  // Fetch court utilization data
  const { data: utilizationData = [] } = useQuery({
    queryKey: ['admin', 'utilization'],
    queryFn: async () => {
      const { data: courts } = await supabase.from('courts').select('id, name');
      const { data: bookingCounts } = await supabase
        .from('bookings')
        .select('court_id')
        .eq('resource_type', 'court')
        .not('court_id', 'is', null);

      const countMap = new Map<string, number>();
      bookingCounts?.forEach((b) => {
        countMap.set(b.court_id!, (countMap.get(b.court_id!) || 0) + 1);
      });

      return (
        courts?.map((court) => ({
          name: court.name,
          bookings: countMap.get(court.id) || 0,
        })) || []
      );
    },
  });

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const approvedToday = bookings.filter(
    (b) =>
      b.status === 'approved' &&
      new Date(b.updated_at).toDateString() === new Date().toDateString()
  ).length;

  if (authLoading || bookingsLoading) {
    return (
      <AdminLayout title="Admin Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      icon: GraduationCap,
      label: 'Active Classes',
      value: stats?.totalClasses || 0,
      change: `${stats?.totalUsers || 0} representatives`,
      color: 'text-primary bg-primary/10',
    },
    {
      icon: Calendar,
      label: 'Pending Approvals',
      value: pendingBookings.length,
      change: pendingBookings.length > 0 ? 'Needs attention' : 'All clear',
      color: 'text-warning bg-warning/10',
    },
    {
      icon: Package,
      label: 'Equipment Issued',
      value: stats?.equipmentIssued || 0,
      change: `${stats?.lowStockItems || 0} low stock`,
      color: 'text-accent bg-accent/10',
    },
    {
      icon: AlertTriangle,
      label: 'Total Courts',
      value: stats?.totalCourts || 0,
      change: 'Available facilities',
      color: 'text-success bg-success/10',
    },
  ];

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Manage sports facilities and monitor usage"
    >
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-card rounded-2xl p-6 border border-border"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="text-3xl font-bold font-display text-foreground mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className="text-xs text-accent mt-2">{stat.change}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Pending Approvals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Pending Approvals
            </h2>
            <Link to="/admin/approvals">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {pendingBookings.length > 0 ? (
              pendingBookings.slice(0, 4).map((booking, index) => {
                const resourceName =
                  booking.court?.name || booking.equipment?.name || 'Unknown';
                const userName = booking.profile?.full_name || 'Unknown';
                const classNameVal = booking.class?.name || 'Individual';
                const bookingDate = format(
                  new Date(booking.start_time),
                  'MMM dd, h:mm a'
                );

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-gradient-card rounded-xl p-4 border border-border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          booking.resource_type === 'court'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-accent/10 text-accent'
                        }`}
                      >
                        {booking.resource_type === 'court' ? (
                          <Calendar className="w-5 h-5" />
                        ) : (
                          <Package className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{resourceName}</p>
                        <p className="text-sm text-muted-foreground">
                          {userName} • {classNameVal} • {bookingDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {booking.booking_type === 'class' ? 'Class' : 'Individual'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-success hover:bg-success/10"
                        onClick={() => approveBooking.mutate(booking.id)}
                        disabled={approveBooking.isPending}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => rejectBooking.mutate(booking.id)}
                        disabled={rejectBooking.isPending}
                      >
                        <XCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="bg-gradient-card rounded-xl p-8 border border-border text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                <p className="text-muted-foreground">No pending approvals</p>
                <p className="text-sm text-muted-foreground/70">
                  All bookings have been processed
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <div className="bg-gradient-card rounded-xl p-5 border border-border">
            <h3 className="font-display font-semibold text-foreground mb-4">
              Today's Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Pending Bookings</span>
                </div>
                <span className="font-semibold text-foreground">
                  {pendingBookings.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">Approved Today</span>
                </div>
                <span className="font-semibold text-success">{approvedToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-accent" />
                  <span className="text-sm text-muted-foreground">Equipment Out</span>
                </div>
                <span className="font-semibold text-foreground">
                  {stats?.equipmentIssued || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-warning" />
                  <span className="text-sm text-muted-foreground">Total Bookings</span>
                </div>
                <span className="font-semibold text-warning">{bookings.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-card rounded-xl p-5 border border-border">
            <h3 className="font-display font-semibold text-foreground mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link to="/admin/approvals">
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Review Approvals
                </Button>
              </Link>
              <Link to="/admin/inventory">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  Manage Inventory
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  View All Users
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 bg-gradient-card rounded-xl p-6 border border-border"
      >
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">
          Court Utilization (Bookings)
        </h3>
        <div className="h-64">
          {utilizationData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar
                  dataKey="bookings"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No booking data available yet
            </div>
          )}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminDashboard;
