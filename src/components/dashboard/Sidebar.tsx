import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Package, 
  Settings, 
  Bell, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  User,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { currentUser } from '@/lib/data';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Calendar, label: 'Courts', href: '/courts' },
  { icon: Package, label: 'Equipment', href: '/equipment' },
  { icon: CreditCard, label: 'My Bookings', href: '/bookings' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border z-40 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border h-16">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-display text-lg font-bold text-sidebar-foreground"
            >
              SportSync
            </motion.span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hidden lg:block"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-sidebar-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentUser.classId}
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <Link to="/">
            <Button variant="ghost" className="w-full mt-3 justify-start text-muted-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </Link>
        )}
      </div>
    </motion.aside>
  );
};
