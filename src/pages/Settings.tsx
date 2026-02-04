import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Bell, 
  Shield, 
  Mail,
  Phone,
  GraduationCap,
  Save,
  Loader2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface ClassInfo {
  name: string;
  class_id: string;
  class_code: string | null;
  department: string;
}

const Settings = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  
  const [formProfile, setFormProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    student_id: '',
  });

  const [notifications, setNotifications] = useState({
    bookingUpdates: true,
    equipmentReminders: true,
    penaltyAlerts: true,
    classAnnouncements: true,
    emailNotifications: false,
  });

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setFormProfile({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        student_id: profile.student_id || '',
      });
    }
  }, [profile]);

  // Fetch class info
  useEffect(() => {
    const fetchClassInfo = async () => {
      if (!profile?.class_id) return;
      
      const { data, error } = await supabase
        .from('classes')
        .select('name, class_id, class_code, department')
        .eq('id', profile.class_id)
        .single();
      
      if (!error && data) {
        setClassInfo(data);
      }
    };
    
    fetchClassInfo();
  }, [profile?.class_id]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formProfile.full_name,
          phone: formProfile.phone,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved!');
  };

  if (authLoading) {
    return (
      <DashboardLayout title="Settings" subtitle="Manage your account and preferences">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Manage your account and preferences"
    >
      <div className="max-w-3xl space-y-8">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-card rounded-xl p-6 border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Profile Information
              </h2>
              <p className="text-sm text-muted-foreground">
                Update your personal details
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formProfile.full_name}
                  onChange={(e) => setFormProfile({ ...formProfile, full_name: e.target.value })}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formProfile.email}
                  disabled
                  className="pl-10 bg-muted border-border cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formProfile.phone}
                  onChange={(e) => setFormProfile({ ...formProfile, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="pl-10 bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="studentId"
                  value={formProfile.student_id}
                  disabled
                  className="pl-10 bg-muted border-border cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Class Info */}
          {classInfo && (
            <div className="bg-secondary/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-accent" />
                <span className="font-medium text-foreground">Class Information</span>
                {profile?.is_representative && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                    Representative
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Class Name:</span>
                  <span className="ml-2 text-foreground font-medium">{classInfo.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Class ID:</span>
                  <span className="ml-2 text-foreground font-medium">{classInfo.class_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Department:</span>
                  <span className="ml-2 text-foreground font-medium">{classInfo.department}</span>
                </div>
                {classInfo.class_code && (
                  <div>
                    <span className="text-muted-foreground">Class Code:</span>
                    <span className="ml-2 text-success font-mono font-bold">{classInfo.class_code}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="hero" onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-card rounded-xl p-6 border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Notification Preferences
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose what notifications you receive
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'bookingUpdates', label: 'Booking Updates', description: 'Get notified about booking approvals and changes' },
              { key: 'equipmentReminders', label: 'Equipment Reminders', description: 'Receive reminders for equipment returns' },
              { key: 'penaltyAlerts', label: 'Penalty Alerts', description: 'Get alerts about penalties and late fees' },
              { key: 'classAnnouncements', label: 'Class Announcements', description: 'Receive announcements for your class' },
              { key: 'emailNotifications', label: 'Email Notifications', description: 'Also receive notifications via email' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, [item.key]: checked })
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-border mt-4">
            <Button variant="hero" onClick={handleSaveNotifications}>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </motion.div>

        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-card rounded-xl p-6 border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-info" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Security
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage your account security
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
              <Button variant="outline">Change</Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline">Enable</Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
              </div>
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                Delete
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
