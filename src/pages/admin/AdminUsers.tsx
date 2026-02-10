import { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  UserCheck,
  Mail,
  Shield,
  GraduationCap,
  Filter,
  Loader2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  student_id: string | null;
  is_representative: boolean | null;
  class_id: string | null;
  created_at: string;
  role: string;
  class_name: string | null;
  class_department: string | null;
  booking_count: number;
}

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  // Fetch real users with their roles and class info
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch classes
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name, department');

      if (classesError) throw classesError;

      // Fetch booking counts
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('user_id');

      if (bookingsError) throw bookingsError;

      // Build maps
      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);
      const classMap = new Map(classes?.map((c) => [c.id, c]) || []);
      const bookingCountMap = new Map<string, number>();
      bookings?.forEach((b) => {
        bookingCountMap.set(b.user_id, (bookingCountMap.get(b.user_id) || 0) + 1);
      });

      return (profiles || []).map((p) => {
        const cls = p.class_id ? classMap.get(p.class_id) : null;
        return {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          email: p.email,
          phone: p.phone,
          student_id: p.student_id,
          is_representative: p.is_representative,
          class_id: p.class_id,
          created_at: p.created_at,
          role: (roleMap.get(p.user_id) as string) || 'student',
          class_name: cls?.name || null,
          class_department: cls?.department || null,
          booking_count: bookingCountMap.get(p.user_id) || 0,
        } as UserWithRole;
      });
    },
  });

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.class_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleColors: Record<string, string> = {
    student: 'bg-primary/20 text-primary border-primary/30',
    faculty: 'bg-accent/20 text-accent border-accent/30',
    admin: 'bg-warning/20 text-warning border-warning/30',
  };

  const roleIcons: Record<string, typeof GraduationCap> = {
    student: GraduationCap,
    faculty: UserCheck,
    admin: Shield,
  };

  return (
    <AdminLayout
      title="User Management"
      subtitle={`${users.length} total registered users`}
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
            placeholder="Search by name, email, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Role: {roleFilter || 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setRoleFilter(null)}>All Roles</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('student')}>Students</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('faculty')}>Faculty</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('admin')}>Admins</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-card rounded-xl border border-border overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Class</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground text-center">Bookings</TableHead>
                <TableHead className="text-muted-foreground">Joined</TableHead>
                <TableHead className="text-muted-foreground w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, index) => {
                const RoleIcon = roleIcons[user.role] || GraduationCap;
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <RoleIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.full_name}
                            {user.is_representative && (
                              <Badge className="ml-2 bg-accent/20 text-accent border-accent/30 text-xs">RP</Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-foreground">
                        {user.class_name ? (
                          <>
                            <p className="font-medium">{user.class_name}</p>
                            <p className="text-xs text-muted-foreground">{user.class_department}</p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role] || roleColors.student}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-foreground">{user.booking_count}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info(`Student ID: ${user.student_id || 'N/A'}`)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info(`Email: ${user.email}`)}>
                            <Mail className="w-4 h-4 mr-2" />
                            Contact
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">No users found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </motion.div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
