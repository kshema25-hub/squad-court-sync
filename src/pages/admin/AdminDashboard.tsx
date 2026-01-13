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
  XCircle
} from 'lucide-react';
import { adminUsers, pendingBookings, inventoryItems, analyticsData } from '@/lib/admin-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const stats = [
    { 
      icon: Users, 
      label: 'Total Users', 
      value: adminUsers.length, 
      change: '+3 this month',
      color: 'text-primary bg-primary/10' 
    },
    { 
      icon: Calendar, 
      label: 'Pending Approvals', 
      value: pendingBookings.filter(b => b.status === 'pending').length, 
      change: 'Needs attention',
      color: 'text-warning bg-warning/10' 
    },
    { 
      icon: Package, 
      label: 'Equipment Issued', 
      value: inventoryItems.reduce((acc, item) => acc + item.issuedQuantity, 0), 
      change: '29 items out',
      color: 'text-accent bg-accent/10' 
    },
    { 
      icon: AlertTriangle, 
      label: 'Items Need Attention', 
      value: inventoryItems.filter(i => i.condition === 'needs-attention').length, 
      change: 'Check inventory',
      color: 'text-destructive bg-destructive/10' 
    },
  ];

  return (
    <AdminLayout 
      title="Admin Dashboard" 
      subtitle="Manage sports facilities and monitor usage"
    >
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-card rounded-2xl p-6 border border-border"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
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
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>

          <div className="space-y-3">
            {pendingBookings.slice(0, 4).map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-gradient-card rounded-xl p-4 border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${booking.type === 'court' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                    {booking.type === 'court' ? <Calendar className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {booking.courtName || booking.equipmentName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.userName} • {booking.userClass} • {booking.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {booking.bookingType}
                  </Badge>
                  <Button variant="ghost" size="icon" className="text-success hover:bg-success/10">
                    <CheckCircle className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            ))}
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
            <h3 className="font-display font-semibold text-foreground mb-4">Today's Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Active Bookings</span>
                </div>
                <span className="font-semibold text-foreground">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">Court Utilization</span>
                </div>
                <span className="font-semibold text-success">78%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-accent" />
                  <span className="text-sm text-muted-foreground">Equipment Out</span>
                </div>
                <span className="font-semibold text-foreground">29</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm text-muted-foreground">Overdue Returns</span>
                </div>
                <span className="font-semibold text-warning">3</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-card rounded-xl p-5 border border-border">
            <h3 className="font-display font-semibold text-foreground mb-4">Quick Actions</h3>
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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.courtUtilization}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminDashboard;
