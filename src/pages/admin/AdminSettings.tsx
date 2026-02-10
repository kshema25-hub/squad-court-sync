import { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  User,
  Save,
  Loader2,
  Ban,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AdminSettings = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [showGlobalBlock, setShowGlobalBlock] = useState(false);

  const [adminProfile, setAdminProfile] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });

  const [blockForm, setBlockForm] = useState({
    reason: 'Examination Period',
    start_time: '',
    end_time: '',
  });

  // Fetch global blocks
  const { data: globalBlocks = [] } = useQuery({
    queryKey: ['admin', 'time-blocks', 'global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('resource_type', 'global')
        .order('start_time', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: adminProfile.full_name, phone: adminProfile.phone })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Profile updated!');
    } catch (e: any) {
      toast.error('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Global block mutation
  const createGlobalBlock = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from('time_blocks').insert({
        resource_type: 'global',
        reason: blockForm.reason,
        start_time: blockForm.start_time,
        end_time: blockForm.end_time,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'time-blocks'] });
      toast.success('Global block created! All bookings are blocked during this period.');
      setShowGlobalBlock(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('time_blocks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'time-blocks'] });
      toast.success('Block removed');
    },
  });

  return (
    <AdminLayout title="Admin Settings" subtitle="Manage system settings and global blocks">
      <div className="max-w-3xl space-y-8">
        {/* Admin Profile */}
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
              <h2 className="font-display text-lg font-semibold text-foreground">Admin Profile</h2>
              <p className="text-sm text-muted-foreground">Update your administrator details</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={adminProfile.full_name}
                onChange={(e) => setAdminProfile({ ...adminProfile, full_name: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email || ''} disabled className="bg-muted border-border cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={adminProfile.phone}
                onChange={(e) => setAdminProfile({ ...adminProfile, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </motion.div>

        {/* Global Maintenance Blocks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-card rounded-xl p-6 border border-border"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Ban className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Global Maintenance Blocks
                </h2>
                <p className="text-sm text-muted-foreground">
                  Block all bookings during examinations or maintenance
                </p>
              </div>
            </div>
            <Button variant="destructive" onClick={() => setShowGlobalBlock(true)}>
              <Ban className="w-4 h-4 mr-2" />
              Add Block
            </Button>
          </div>

          {globalBlocks.length > 0 ? (
            <div className="space-y-3">
              {globalBlocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="font-medium text-foreground">{block.reason}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(block.start_time), 'MMM dd, yyyy h:mm a')} -{' '}
                        {format(new Date(block.end_time), 'MMM dd, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteBlock.mutate(block.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No active global blocks</p>
          )}
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-card rounded-xl p-6 border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Security</h2>
              <p className="text-sm text-muted-foreground">Manage account security</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your admin password</p>
              </div>
              <Button variant="outline" onClick={() => toast.info('Password reset email sent')}>
                Change
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Global Block Dialog */}
      <Dialog open={showGlobalBlock} onOpenChange={setShowGlobalBlock}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create Global Block</DialogTitle>
            <DialogDescription>
              Block ALL bookings (courts & equipment) during this period
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={blockForm.reason} onValueChange={(v) => setBlockForm({ ...blockForm, reason: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Examination Period">Examination Period</SelectItem>
                  <SelectItem value="Campus Maintenance">Campus Maintenance</SelectItem>
                  <SelectItem value="Holiday">Holiday</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start</Label>
              <Input type="datetime-local" value={blockForm.start_time} onChange={(e) => setBlockForm({ ...blockForm, start_time: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>End</Label>
              <Input type="datetime-local" value={blockForm.end_time} onChange={(e) => setBlockForm({ ...blockForm, end_time: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowGlobalBlock(false)}>Cancel</Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!blockForm.start_time || !blockForm.end_time || createGlobalBlock.isPending}
                onClick={() => createGlobalBlock.mutate()}
              >
                {createGlobalBlock.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Block All Bookings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSettings;
