import { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit,
  MapPin,
  Users,
  Loader2,
  Search,
  Calendar,
  Ban,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';

type Court = Tables<'courts'>;

const AdminCourts = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCourt, setShowAddCourt] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockingCourt, setBlockingCourt] = useState<Court | null>(null);

  // Court form state
  const [courtForm, setCourtForm] = useState({
    name: '',
    sport: '',
    location: '',
    capacity: 10,
    image_url: '',
    amenities: '',
    is_available: true,
  });

  // Block form state
  const [blockForm, setBlockForm] = useState({
    reason: 'Maintenance',
    start_time: '',
    end_time: '',
    resource_type: 'court' as const,
  });

  // Fetch courts
  const { data: courts = [], isLoading } = useQuery({
    queryKey: ['admin', 'courts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch time blocks for courts
  const { data: timeBlocks = [] } = useQuery({
    queryKey: ['admin', 'time-blocks', 'court'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .in('resource_type', ['court', 'global'])
        .order('start_time', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Add court mutation
  const addCourt = useMutation({
    mutationFn: async (form: typeof courtForm) => {
      const { error } = await supabase.from('courts').insert({
        name: form.name,
        sport: form.sport,
        location: form.location,
        capacity: form.capacity,
        image_url: form.image_url || null,
        amenities: form.amenities ? form.amenities.split(',').map((a) => a.trim()) : [],
        is_available: form.is_available,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courts'] });
      toast.success('Court added successfully!');
      setShowAddCourt(false);
      resetCourtForm();
    },
    onError: (e: Error) => toast.error('Failed to add court: ' + e.message),
  });

  // Update court mutation
  const updateCourt = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: typeof courtForm }) => {
      const { error } = await supabase
        .from('courts')
        .update({
          name: form.name,
          sport: form.sport,
          location: form.location,
          capacity: form.capacity,
          image_url: form.image_url || null,
          amenities: form.amenities ? form.amenities.split(',').map((a) => a.trim()) : [],
          is_available: form.is_available,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courts'] });
      toast.success('Court updated!');
      setEditingCourt(null);
      resetCourtForm();
    },
    onError: (e: Error) => toast.error('Failed to update court: ' + e.message),
  });

  // Toggle availability
  const toggleAvailability = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const { error } = await supabase
        .from('courts')
        .update({ is_available: available })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courts'] });
    },
  });

  // Create time block
  const createBlock = useMutation({
    mutationFn: async () => {
      if (!blockingCourt || !user) return;
      const { error } = await supabase.from('time_blocks').insert({
        resource_type: blockForm.resource_type,
        court_id: blockingCourt.id,
        reason: blockForm.reason,
        start_time: blockForm.start_time,
        end_time: blockForm.end_time,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'time-blocks'] });
      toast.success('Time block created!');
      setShowBlockDialog(false);
      setBlockingCourt(null);
    },
    onError: (e: Error) => toast.error('Failed to create block: ' + e.message),
  });

  // Delete time block
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

  const resetCourtForm = () => {
    setCourtForm({ name: '', sport: '', location: '', capacity: 10, image_url: '', amenities: '', is_available: true });
  };

  const openEdit = (court: Court) => {
    setEditingCourt(court);
    setCourtForm({
      name: court.name,
      sport: court.sport,
      location: court.location,
      capacity: court.capacity,
      image_url: court.image_url || '',
      amenities: (court.amenities || []).join(', '),
      is_available: court.is_available,
    });
  };

  const filteredCourts = courts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Court Management" subtitle="Add, edit, and manage court availability">
      {/* Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <Button variant="default" onClick={() => { resetCourtForm(); setShowAddCourt(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Court
        </Button>
      </motion.div>

      {/* Courts Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-card rounded-xl border border-border overflow-hidden mb-8"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Court</TableHead>
                <TableHead className="text-muted-foreground">Sport</TableHead>
                <TableHead className="text-muted-foreground">Location</TableHead>
                <TableHead className="text-muted-foreground text-center">Capacity</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourts.map((court, index) => (
                <motion.tr
                  key={court.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-border hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{court.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{court.sport}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {court.location}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-foreground">
                      <Users className="w-3 h-3" />
                      {court.capacity}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={court.is_available}
                        onCheckedChange={(checked) =>
                          toggleAvailability.mutate({ id: court.id, available: checked })
                        }
                      />
                      <Badge className={court.is_available ? 'bg-success/20 text-success border-success/30' : 'bg-destructive/20 text-destructive border-destructive/30'}>
                        {court.is_available ? 'Available' : 'Blocked'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(court)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-warning"
                        onClick={() => {
                          setBlockingCourt(court);
                          setShowBlockDialog(true);
                        }}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {/* Active Time Blocks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-display text-xl font-semibold text-foreground mb-4">
          Active Time Blocks
        </h2>
        {timeBlocks.length > 0 ? (
          <div className="space-y-3">
            {timeBlocks.map((block) => {
              const court = courts.find((c) => c.id === block.court_id);
              return (
                <div
                  key={block.id}
                  className="bg-gradient-card rounded-xl p-4 border border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Ban className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {block.resource_type === 'global' ? 'Global Block' : court?.name || 'Unknown Court'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {block.reason} • {format(new Date(block.start_time), 'MMM dd, h:mm a')} - {format(new Date(block.end_time), 'MMM dd, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => deleteBlock.mutate(block.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gradient-card rounded-xl p-8 border border-border text-center">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-muted-foreground">No active time blocks</p>
          </div>
        )}
      </motion.div>

      {/* Add/Edit Court Dialog */}
      <Dialog open={showAddCourt || !!editingCourt} onOpenChange={() => { setShowAddCourt(false); setEditingCourt(null); resetCourtForm(); }}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingCourt ? 'Edit Court' : 'Add New Court'}
            </DialogTitle>
            <DialogDescription>
              {editingCourt ? 'Update court details' : 'Add a new sports court to the system'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Court Name</Label>
                <Input value={courtForm.name} onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })} placeholder="e.g. Basketball Court A" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Sport</Label>
                <Input value={courtForm.sport} onChange={(e) => setCourtForm({ ...courtForm, sport: e.target.value })} placeholder="e.g. Basketball" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={courtForm.location} onChange={(e) => setCourtForm({ ...courtForm, location: e.target.value })} placeholder="e.g. Block A, Ground Floor" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={courtForm.capacity} onChange={(e) => setCourtForm({ ...courtForm, capacity: parseInt(e.target.value) || 1 })} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URL (optional)</Label>
              <Input value={courtForm.image_url} onChange={(e) => setCourtForm({ ...courtForm, image_url: e.target.value })} placeholder="https://..." className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Amenities (comma separated)</Label>
              <Input value={courtForm.amenities} onChange={(e) => setCourtForm({ ...courtForm, amenities: e.target.value })} placeholder="Lighting, Seating, Water" className="bg-secondary border-border" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={courtForm.is_available} onCheckedChange={(v) => setCourtForm({ ...courtForm, is_available: v })} />
              <Label>Available for booking</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddCourt(false); setEditingCourt(null); resetCourtForm(); }}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!courtForm.name || !courtForm.sport || !courtForm.location || addCourt.isPending || updateCourt.isPending}
                onClick={() => {
                  if (editingCourt) {
                    updateCourt.mutate({ id: editingCourt.id, form: courtForm });
                  } else {
                    addCourt.mutate(courtForm);
                  }
                }}
              >
                {(addCourt.isPending || updateCourt.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingCourt ? 'Update Court' : 'Add Court'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Time Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={() => { setShowBlockDialog(false); setBlockingCourt(null); }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Block Time Slot</DialogTitle>
            <DialogDescription>
              Block {blockingCourt?.name} from being booked during a specific period
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
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Examination Period">Examination Period</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="Weather">Weather</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="datetime-local"
                value={blockForm.start_time}
                onChange={(e) => setBlockForm({ ...blockForm, start_time: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="datetime-local"
                value={blockForm.end_time}
                onChange={(e) => setBlockForm({ ...blockForm, end_time: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowBlockDialog(false); setBlockingCourt(null); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!blockForm.start_time || !blockForm.end_time || createBlock.isPending}
                onClick={() => createBlock.mutate()}
              >
                {createBlock.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Block Time
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCourts;
