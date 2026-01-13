import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  QrCode, 
  Clock, 
  BarChart3, 
  Shield,
  AlertTriangle,
  Smartphone
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Real-time Court Booking',
    description: 'View live availability and book courts instantly. No more conflicts or double bookings.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Users,
    title: 'Class-Based Allocation',
    description: 'Book on behalf of your entire class using unique Class IDs. Perfect for PE periods and team practices.',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    icon: QrCode,
    title: 'QR Verification',
    description: 'Verify bookings and equipment handoffs with secure QR codes. Fast, reliable, contactless.',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    icon: Clock,
    title: 'Automated Delay Fees',
    description: 'Transparent penalty system for late returns. Individual or class-shared responsibility options.',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track utilization, identify peak hours, and optimize resource allocation with data insights.',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Secure access control for students, faculty, and admins. Everyone sees what they need.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: AlertTriangle,
    title: 'Equipment Tracking',
    description: 'Monitor equipment condition, availability, and usage history. Reduce losses and damage.',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    icon: Smartphone,
    title: 'Smart Notifications',
    description: 'Get reminders for bookings, return deadlines, and important updates. Never miss a slot.',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const Features = () => {
  return (
    <section className="py-24 bg-background relative">
      <div className="container px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="text-gradient-primary">Manage Sports</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            A comprehensive platform designed for modern campus sports management
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative bg-gradient-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-glow"
            >
              <div className={`${feature.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
