import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Shield, GraduationCap, Users, Check, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TestAccount {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  studentId?: string;
}

const testAccounts: TestAccount[] = [
  { email: 'admin@test.com', password: 'admin123', name: 'Admin User', role: 'admin' },
  { email: 'faculty@test.com', password: 'faculty123', name: 'Dr. Sports Faculty', role: 'faculty' },
  { email: 'student@test.com', password: 'student123', name: 'Rahul Student', role: 'student', studentId: 'STU2024001' },
];

const TestSetup = () => {
  const [createdAccounts, setCreatedAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [existingUsers, setExistingUsers] = useState<{ email: string; role: string }[]>([]);
  const [checking, setChecking] = useState(false);

  const checkExistingUsers = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email, user_id');
      
      if (error) throw error;

      const usersWithRoles = await Promise.all(
        (data || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .maybeSingle();
          return {
            email: profile.email,
            role: roleData?.role || 'unknown'
          };
        })
      );

      setExistingUsers(usersWithRoles);
    } catch (err) {
      console.error('Error checking users:', err);
    } finally {
      setChecking(false);
    }
  };

  const createAccount = async (account: TestAccount) => {
    setLoading(account.email);
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: account.name,
            student_id: account.studentId || null,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.info(`${account.email} already exists`);
          setCreatedAccounts(prev => [...prev, account.email]);
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        // Update role if not student (student is default)
        if (account.role !== 'student') {
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role: account.role })
            .eq('user_id', data.user.id);

          if (roleError) {
            console.error('Error updating role:', roleError);
          }
        }

        setCreatedAccounts(prev => [...prev, account.email]);
        toast.success(`Created ${account.role} account: ${account.email}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setLoading(null);
    }
  };

  const createAllAccounts = async () => {
    for (const account of testAccounts) {
      if (!createdAccounts.includes(account.email)) {
        await createAccount(account);
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'faculty':
        return <GraduationCap className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'faculty':
        return 'bg-accent/10 text-accent border-accent/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-6">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Test Account Setup
              </CardTitle>
              <CardDescription>
                Create test accounts with different roles to verify role-based access control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create Accounts Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Test Accounts</h3>
                  <Button 
                    onClick={createAllAccounts} 
                    size="sm"
                    disabled={loading !== null || createdAccounts.length === testAccounts.length}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create All
                  </Button>
                </div>

                <div className="space-y-3">
                  {testAccounts.map((account) => (
                    <div
                      key={account.email}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getRoleColor(account.role)}`}>
                          {getRoleIcon(account.role)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{account.name}</p>
                          <p className="text-xs text-muted-foreground">{account.email}</p>
                          <p className="text-xs text-muted-foreground">Password: {account.password}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getRoleColor(account.role)}>
                          {account.role}
                        </Badge>
                        {createdAccounts.includes(account.email) ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => createAccount(account)}
                            disabled={loading !== null}
                          >
                            {loading === account.email ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Create'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Existing Users Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Existing Users</h3>
                  <Button 
                    onClick={checkExistingUsers} 
                    size="sm" 
                    variant="outline"
                    disabled={checking}
                  >
                    {checking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </div>

                {existingUsers.length > 0 ? (
                  <div className="space-y-2">
                    {existingUsers.map((user) => (
                      <div
                        key={user.email}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                      >
                        <span className="text-sm">{user.email}</span>
                        <Badge variant="outline" className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Click refresh to check existing users
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-sm mb-2">How to test:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Create test accounts above</li>
                  <li>Go to <Link to="/login" className="text-primary hover:underline">Login page</Link></li>
                  <li>Sign in with different accounts to test access:</li>
                </ol>
                <ul className="text-sm text-muted-foreground mt-2 ml-4 space-y-1">
                  <li>• <strong>Student:</strong> Can access dashboard, book courts/equipment</li>
                  <li>• <strong>Faculty:</strong> Can access admin panel (except user management)</li>
                  <li>• <strong>Admin:</strong> Full access to all admin features</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default TestSetup;
