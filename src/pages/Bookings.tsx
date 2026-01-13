import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BookingCard } from '@/components/dashboard/BookingCard';
import { upcomingBookings } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Bookings = () => {
  const activeBookings = upcomingBookings.filter(
    (b) => b.status === 'approved' || b.status === 'pending'
  );
  const pastBookings = upcomingBookings.filter(
    (b) => b.status === 'completed' || b.status === 'rejected'
  );

  return (
    <DashboardLayout
      title="My Bookings"
      subtitle="View and manage your court and equipment bookings"
    >
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <Tabs defaultValue="active" className="w-full">
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
            <TabsList className="bg-secondary">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Link to="/courts">
                <Button variant="hero">
                  <Plus className="w-4 h-4 mr-2" />
                  Book Court
                </Button>
              </Link>
              <Link to="/equipment">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Request Equipment
                </Button>
              </Link>
            </div>
          </div>

          <TabsContent value="active">
            {activeBookings.length > 0 ? (
              <div className="space-y-4">
                {activeBookings.map((booking, index) => (
                  <BookingCard key={booking.id} booking={booking} index={index} />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-card rounded-xl p-12 border border-border text-center"
              >
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  No Active Bookings
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You don't have any active bookings. Browse available courts and equipment to get started.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to="/courts">
                    <Button variant="hero">Browse Courts</Button>
                  </Link>
                  <Link to="/equipment">
                    <Button variant="outline">View Equipment</Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastBookings.length > 0 ? (
              <div className="space-y-4">
                {pastBookings.map((booking, index) => (
                  <BookingCard key={booking.id} booking={booking} index={index} />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-card rounded-xl p-12 border border-border text-center"
              >
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  No Past Bookings
                </h3>
                <p className="text-muted-foreground">
                  Your booking history will appear here once you complete your first booking.
                </p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Bookings;
