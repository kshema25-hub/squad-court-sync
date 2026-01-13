import { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminUsers, AdminUser } from '@/lib/admin-data';
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
  UserX, 
  Mail,
  Shield,
  GraduationCap,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

const AdminUsers = () => {
  const [users, setUsers] = useState(adminUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.classId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleStatusChange = (userId: string, newStatus: AdminUser['status']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    toast.success(`User status updated to ${newStatus}`);
  };

  const handleRoleChange = (userId: string, newRole: AdminUser['role']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success(`User role updated to ${newRole}`);
  };

  const statusColors = {
    active: 'bg-success/20 text-success border-success/30',
    suspended: 'bg-destructive/20 text-destructive border-destructive/30',
    pending: 'bg-warning/20 text-warning border-warning/30',
  };

  const roleColors = {
    student: 'bg-primary/20 text-primary border-primary/30',
    faculty: 'bg-accent/20 text-accent border-accent/30',
    admin: 'bg-info/20 text-info border-info/30',
  };

  const roleIcons = {
    student: GraduationCap,
    faculty: UserCheck,
    admin: Shield,
  };

  return (
    <AdminLayout
      title="User Management"
      subtitle={`${users.length} total users, ${users.filter(u => u.status === 'active').length} active`}
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Status: {statusFilter || 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>All Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('suspended')}>Suspended</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-card rounded-xl border border-border overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Class/Dept</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-center">Bookings</TableHead>
              <TableHead className="text-muted-foreground text-center">Penalties</TableHead>
              <TableHead className="text-muted-foreground">Joined</TableHead>
              <TableHead className="text-muted-foreground w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user, index) => {
              const RoleIcon = roleIcons[user.role];
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
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{user.classId}</TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role]}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[user.status]}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-foreground">{user.bookingsCount}</TableCell>
                  <TableCell className="text-center">
                    <span className={user.penaltiesCount > 0 ? 'text-warning font-medium' : 'text-foreground'}>
                      {user.penaltiesCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.joinedAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info('View user details')}>
                          <UserCheck className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info('Send email')}>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        {user.status !== 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'active')}>
                            <UserCheck className="w-4 h-4 mr-2 text-success" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                        {user.status === 'active' && user.role !== 'admin' && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(user.id, 'suspended')}
                            className="text-destructive"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Suspend User
                          </DropdownMenuItem>
                        )}
                        {user.role === 'student' && (
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'faculty')}>
                            <Shield className="w-4 h-4 mr-2" />
                            Promote to Faculty
                          </DropdownMenuItem>
                        )}
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
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              No users found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default AdminUsers;
