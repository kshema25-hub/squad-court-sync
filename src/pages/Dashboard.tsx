import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { BookingCard } from '@/components/dashboard/BookingCard';
import { Calendar, Package, Clock, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUpcomingBookings, useBookingStats } from '@/hooks/useBookings';
import { useAvailableCourtsCount, useAvailableEquipmentCount } from '@/hooks/useResources';
import { useUserClass } from '@/hooks/useClasses';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const { data: upcomingBookings, isLoading: bookingsLoading } = useUpcomingBookings(user?.id);
  const { data: stats, isLoading: statsLoading } = useBookingStats(user?.id);
  const { data: availableCourts } = useAvailableCourtsCount();
  const { data: availableEquipment } = useAvailableEquipmentCount();
  const { data: userClass } = useUserClass(user?.id);

  const displayStats = [
    { 
      icon: Calendar, 
      label: 'Active Bookings', 
      value: stats?.activeBookings ?? 0, 
      change: 'Upcoming', 
      changeType: 'positive' as const 
    },
    { 
      icon: Package, 
      label: 'Equipment Issued', 
      value: stats?.equipmentIssued ?? 0, 
      change: 'Currently out', 
      changeType: 'neutral' as const 
    },
    { 
      icon: Clock, 
      label: 'Hours Booked', 
      value: stats?.hoursBooked ?? 0, 
      change: 'This month', 
      changeType: 'neutral' as const 
    },
    { 
      icon: AlertTriangle, 
      label: 'Pending Fees', 
      value: stats?.pendingFees ? `₹${stats.pendingFees}` : '₹0', 
      change: stats?.pendingFees ? 'Due' : 'All clear!', 
      changeType: stats?.pendingFees ? 'negative' as const : 'positive' as const 
    },
  ];

  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  return (
    <DashboardLayout
      title={`Welcome back, ${firstName}!`}
      subtitle={profile?.student_id ? `Student ID: ${profile.student_id}` : profile?.email}
    >
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {displayStats.map((stat, index) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={statsLoading ? '...' : stat.value}
            change={stat.change}
            changeType={stat.changeType}
            delay={index * 0.1}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upcoming Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Upcoming Bookings
            </h2>
            <Link to="/bookings">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {bookingsLoading ? (
              <div className="bg-gradient-card rounded-xl p-8 border border-border text-center">
                <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                <p className="text-muted-foreground">Loading bookings...</p>
              </div>
            ) : upcomingBookings && upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking, index) => (
                <BookingCard key={booking.id} booking={booking} index={index} />
              ))
            ) : (
              <div className="bg-gradient-card rounded-xl p-8 border border-border text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-display font-semibold text-foreground mb-1">
                  No Upcoming Bookings
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Book a court or request equipment to get started
                </p>
                <Link to="/courts">
                  <Button variant="hero">Browse Courts</Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </h2>

          <div className="space-y-3">
            <Link to="/courts">
              <div className="bg-gradient-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Book a Court</h4>
                    <p className="text-sm text-muted-foreground">
                      {availableCourts ?? 0} courts available
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/equipment">
              <div className="bg-gradient-card rounded-xl p-4 border border-border hover:border-accent/30 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Package className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Request Equipment</h4>
                    <p className="text-sm text-muted-foreground">
                      {availableEquipment ?? 0} items available
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <div className="bg-gradient-card rounded-xl p-4 border border-border hover:border-info/30 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center group-hover:bg-info/20 transition-colors">
                  <Clock className="w-6 h-6 text-info" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Class Booking</h4>
                  <p className="text-sm text-muted-foreground">
                    {userClass ? `Book for ${userClass.class_id}` : 'Join a class first'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Class Info Card */}
          <div className="mt-6 bg-gradient-card rounded-xl p-5 border border-border">
            <h3 className="font-display font-semibold text-foreground mb-3">
              Your Class
            </h3>
            {userClass ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Class ID</span>
                  <span className="font-medium text-foreground">{userClass.class_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Section</span>
                  <span className="font-medium text-foreground">{userClass.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Students</span>
                  <span className="font-medium text-foreground">{userClass.student_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium text-foreground">{userClass.department}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You're not assigned to a class yet. Contact admin to join a class.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
