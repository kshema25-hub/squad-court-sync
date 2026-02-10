import { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Edit,
  Loader2,
  Ban,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';

type Equipment = Tables<'equipment'>;

const AdminInventory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [restockItem, setRestockItem] = useState<Equipment | null>(null);
  const [restockAmount, setRestockAmount] = useState(5);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockingEquipment, setBlockingEquipment] = useState<Equipment | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    category: '',
    total_quantity: 1,
    available_quantity: 1,
    condition: 'Good',
    image_url: '',
  });

  const [blockForm, setBlockForm] = useState({
    reason: 'Maintenance',
    start_time: '',
    end_time: '',
  });

  // Fetch equipment
  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['admin', 'equipment'],
    queryFn: async () => {
      const { data, error } = await supabase.from('equipment').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const categories = [...new Set(equipment.map((e) => e.category))];

  const filteredItems = equipment.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalItems = equipment.reduce((acc, item) => acc + item.total_quantity, 0);
  const availableItems = equipment.reduce((acc, item) => acc + item.available_quantity, 0);
  const issuedItems = totalItems - availableItems;
  const lowStock = equipment.filter((i) => i.available_quantity < 3).length;

  // Add equipment
  const addEquipment = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from('equipment').insert({
        name: f.name,
        category: f.category,
        total_quantity: f.total_quantity,
        available_quantity: f.available_quantity,
        condition: f.condition,
        image_url: f.image_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'equipment'] });
      toast.success('Equipment added!');
      setShowAddDialog(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Update equipment
  const updateEquipment = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: typeof form }) => {
      const { error } = await supabase
        .from('equipment')
        .update({
          name: f.name,
          category: f.category,
          total_quantity: f.total_quantity,
          available_quantity: f.available_quantity,
          condition: f.condition,
          image_url: f.image_url || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'equipment'] });
      toast.success('Equipment updated!');
      setEditingItem(null);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Restock
  const restock = useMutation({
    mutationFn: async () => {
      if (!restockItem) return;
      const { error } = await supabase
        .from('equipment')
        .update({
          total_quantity: restockItem.total_quantity + restockAmount,
          available_quantity: restockItem.available_quantity + restockAmount,
          condition: 'Good',
        })
        .eq('id', restockItem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'equipment'] });
      toast.success(`Restocked ${restockAmount} items!`);
      setRestockItem(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Block equipment
  const createBlock = useMutation({
    mutationFn: async () => {
      if (!blockingEquipment || !user) return;
      const { error } = await supabase.from('time_blocks').insert({
        resource_type: 'equipment',
        equipment_id: blockingEquipment.id,
        reason: blockForm.reason,
        start_time: blockForm.start_time,
        end_time: blockForm.end_time,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Equipment blocked!');
      setShowBlockDialog(false);
      setBlockingEquipment(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({ name: '', category: '', total_quantity: 1, available_quantity: 1, condition: 'Good', image_url: '' });
  };

  const openEdit = (item: Equipment) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      total_quantity: item.total_quantity,
      available_quantity: item.available_quantity,
      condition: item.condition,
      image_url: item.image_url || '',
    });
  };

  const conditionColors: Record<string, string> = {
    Good: 'bg-success/20 text-success border-success/30',
    Fair: 'bg-warning/20 text-warning border-warning/30',
    Poor: 'bg-destructive/20 text-destructive border-destructive/30',
  };

  return (
    <AdminLayout
      title="Equipment Inventory"
      subtitle={`${totalItems} total items, ${availableItems} available, ${issuedItems} issued`}
    >
      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Items', value: totalItems, icon: Package, color: 'text-primary bg-primary/10' },
          { label: 'Available', value: availableItems, icon: CheckCircle, color: 'text-success bg-success/10' },
          { label: 'Issued Out', value: issuedItems, icon: RefreshCw, color: 'text-accent bg-accent/10' },
          { label: 'Low Stock', value: lowStock, icon: AlertTriangle, color: 'text-destructive bg-destructive/10' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-card rounded-xl p-4 border border-border"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search equipment..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary border-border" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={selectedCategory === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(null)}>
            All
          </Button>
          {categories.map((cat) => (
            <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat)}>
              {cat}
            </Button>
          ))}
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment
        </Button>
      </motion.div>

      {/* Equipment Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => {
            const availPercent = item.total_quantity > 0 ? (item.available_quantity / item.total_quantity) * 100 : 0;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-card rounded-xl p-5 border border-border"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-foreground">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <Badge className={conditionColors[item.condition] || conditionColors.Good}>
                    {item.condition}
                  </Badge>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Availability</span>
                    <span className="font-medium text-foreground">{item.available_quantity}/{item.total_quantity}</span>
                  </div>
                  <Progress value={availPercent} className="h-2" />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setRestockItem(item); setRestockAmount(5); }}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Restock
                  </Button>
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => openEdit(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 text-warning"
                    onClick={() => { setBlockingEquipment(item); setShowBlockDialog(true); }}
                  >
                    <Ban className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Equipment Dialog */}
      <Dialog open={showAddDialog || !!editingItem} onOpenChange={() => { setShowAddDialog(false); setEditingItem(null); resetForm(); }}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editingItem ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
            <DialogDescription>{editingItem ? 'Update equipment details' : 'Add new equipment to the inventory'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Basketball" className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Ball Sports" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Total Qty</Label>
                <Input type="number" value={form.total_quantity} onChange={(e) => setForm({ ...form, total_quantity: parseInt(e.target.value) || 1 })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Available</Label>
                <Input type="number" value={form.available_quantity} onChange={(e) => setForm({ ...form, available_quantity: parseInt(e.target.value) || 0 })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URL (optional)</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="bg-secondary border-border" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddDialog(false); setEditingItem(null); resetForm(); }}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={!form.name || !form.category || addEquipment.isPending || updateEquipment.isPending}
                onClick={() => {
                  if (editingItem) {
                    updateEquipment.mutate({ id: editingItem.id, f: form });
                  } else {
                    addEquipment.mutate(form);
                  }
                }}
              >
                {(addEquipment.isPending || updateEquipment.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingItem ? 'Update' : 'Add Equipment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={!!restockItem} onOpenChange={() => setRestockItem(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Restock {restockItem?.name}</DialogTitle>
            <DialogDescription>Current stock: {restockItem?.available_quantity}/{restockItem?.total_quantity}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Quantity to Add</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setRestockAmount(Math.max(1, restockAmount - 1))}>-</Button>
                <Input type="number" value={restockAmount} onChange={(e) => setRestockAmount(Math.max(1, parseInt(e.target.value) || 1))} className="text-center w-20" />
                <Button variant="outline" size="icon" onClick={() => setRestockAmount(restockAmount + 1)}>+</Button>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setRestockItem(null)}>Cancel</Button>
              <Button className="flex-1" onClick={() => restock.mutate()} disabled={restock.isPending}>
                {restock.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Restock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Equipment Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={() => { setShowBlockDialog(false); setBlockingEquipment(null); }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Block Equipment</DialogTitle>
            <DialogDescription>Block {blockingEquipment?.name} from being booked</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={blockForm.reason} onValueChange={(v) => setBlockForm({ ...blockForm, reason: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Examination Period">Examination Period</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
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
              <Button variant="outline" className="flex-1" onClick={() => { setShowBlockDialog(false); setBlockingEquipment(null); }}>Cancel</Button>
              <Button variant="destructive" className="flex-1" disabled={!blockForm.start_time || !blockForm.end_time || createBlock.isPending} onClick={() => createBlock.mutate()}>
                {createBlock.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Block
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminInventory;
