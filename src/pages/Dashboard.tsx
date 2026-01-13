import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { BookingCard } from '@/components/dashboard/BookingCard';
import { Calendar, Package, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { upcomingBookings, currentUser, courts, equipment } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const stats = [
    { icon: Calendar, label: 'Active Bookings', value: 3, change: '+2 this week', changeType: 'positive' as const },
    { icon: Package, label: 'Equipment Issued', value: 2, change: 'Due tomorrow', changeType: 'neutral' as const },
    { icon: Clock, label: 'Hours Booked', value: 12, change: 'This month', changeType: 'neutral' as const },
    { icon: AlertTriangle, label: 'Pending Fees', value: '₹0', change: 'All clear!', changeType: 'positive' as const },
  ];

  return (
    <DashboardLayout
      title={`Welcome back, ${currentUser.name.split(' ')[0]}!`}
      subtitle={`Class ID: ${currentUser.classId} • Student ID: ${currentUser.studentId}`}
    >
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
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
            {upcomingBookings.length > 0 ? (
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
                      {courts.filter((c) => c.available).length} courts available
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
                      {equipment.length} items available
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
                    Book for {currentUser.classId}
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
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Class ID</span>
                <span className="font-medium text-foreground">{currentUser.classId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Section</span>
                <span className="font-medium text-foreground">CSE 2024 - A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Students</span>
                <span className="font-medium text-foreground">60</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coordinator</span>
                <span className="font-medium text-foreground">Dr. Sharma</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
