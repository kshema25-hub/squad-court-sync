import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { analyticsData } from '@/lib/admin-data';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, Users, Clock, Calendar } from 'lucide-react';

const COLORS = ['hsl(160, 84%, 39%)', 'hsl(16, 85%, 60%)', 'hsl(199, 89%, 48%)', 'hsl(38, 92%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(0, 72%, 51%)'];

const AdminAnalytics = () => {
  const chartTooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    color: 'hsl(var(--foreground))'
  };

  return (
    <AdminLayout
      title="Analytics"
      subtitle="Track usage patterns and optimize resource allocation"
    >
      {/* Summary Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Calendar, label: 'Total Bookings', value: '1,247', change: '+12%', color: 'text-primary bg-primary/10' },
          { icon: Clock, label: 'Avg. Duration', value: '1.8 hrs', change: '+5%', color: 'text-accent bg-accent/10' },
          { icon: Users, label: 'Active Users', value: '324', change: '+8%', color: 'text-info bg-info/10' },
          { icon: TrendingUp, label: 'Utilization', value: '78%', change: '+15%', color: 'text-success bg-success/10' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-card rounded-xl p-5 border border-border"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-sm text-success font-medium">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Court Utilization Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-card rounded-xl p-6 border border-border"
        >
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">
            Court Utilization by Sport
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.courtUtilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Bookings" />
                <Bar dataKey="hours" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly Bookings Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-card rounded-xl p-6 border border-border"
        >
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">
            Monthly Booking Trends
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.monthlyBookings}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area 
                  type="monotone" 
                  dataKey="individual" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.6}
                  name="Individual"
                />
                <Area 
                  type="monotone" 
                  dataKey="class" 
                  stackId="1"
                  stroke="hsl(var(--accent))" 
                  fill="hsl(var(--accent))" 
                  fillOpacity={0.6}
                  name="Class"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-card rounded-xl p-6 border border-border"
        >
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">
            Peak Booking Hours
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--accent))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Equipment Usage Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-card rounded-xl p-6 border border-border"
        >
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">
            Equipment Usage Distribution
          </h3>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.equipmentUsage}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="usage"
                >
                  {analyticsData.equipmentUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {analyticsData.equipmentUsage.slice(0, 6).map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground truncate">{item.name}</span>
                  <span className="text-sm font-medium text-foreground ml-auto">{item.usage}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
