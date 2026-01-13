import { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { inventoryItems, InventoryItem } from '@/lib/admin-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Plus, 
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const AdminInventory = () => {
  const [items, setItems] = useState(inventoryItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState(0);

  const categories = [...new Set(items.map(i => i.category))];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalItems = items.reduce((acc, item) => acc + item.totalQuantity, 0);
  const availableItems = items.reduce((acc, item) => acc + item.availableQuantity, 0);
  const issuedItems = items.reduce((acc, item) => acc + item.issuedQuantity, 0);
  const needsAttention = items.filter(i => i.condition === 'needs-attention').length;

  const handleRestock = () => {
    if (!editingItem || restockAmount <= 0) return;
    
    setItems(prev => prev.map(item => 
      item.id === editingItem.id 
        ? { 
            ...item, 
            totalQuantity: item.totalQuantity + restockAmount,
            availableQuantity: item.availableQuantity + restockAmount,
            lastRestocked: new Date().toISOString().split('T')[0],
            condition: 'good' as const
          } 
        : item
    ));
    
    toast.success(`Restocked ${restockAmount} ${editingItem.name}(s)`);
    setEditingItem(null);
    setRestockAmount(0);
  };

  const conditionColors = {
    'good': 'bg-success/20 text-success border-success/30',
    'fair': 'bg-warning/20 text-warning border-warning/30',
    'needs-attention': 'bg-destructive/20 text-destructive border-destructive/30',
  };

  const conditionIcons = {
    'good': CheckCircle,
    'fair': AlertTriangle,
    'needs-attention': AlertTriangle,
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
          { label: 'Needs Attention', value: needsAttention, icon: AlertTriangle, color: 'text-destructive bg-destructive/10' },
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
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? 'hero' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'hero' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        <Button variant="accent">
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment
        </Button>
      </motion.div>

      {/* Inventory Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item, index) => {
          const ConditionIcon = conditionIcons[item.condition];
          const availabilityPercent = (item.availableQuantity / item.totalQuantity) * 100;
          
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
                <Badge className={conditionColors[item.condition]}>
                  <ConditionIcon className="w-3 h-3 mr-1" />
                  {item.condition.replace('-', ' ')}
                </Badge>
              </div>

              {/* Availability bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Availability</span>
                  <span className="font-medium text-foreground">
                    {item.availableQuantity}/{item.totalQuantity}
                  </span>
                </div>
                <Progress value={availabilityPercent} className="h-2" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{item.issuedQuantity}</p>
                  <p className="text-xs text-muted-foreground">Issued</p>
                </div>
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-lg font-bold text-warning">{item.damagedQuantity}</p>
                  <p className="text-xs text-muted-foreground">Damaged</p>
                </div>
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-lg font-bold text-destructive">{item.lostQuantity}</p>
                  <p className="text-xs text-muted-foreground">Lost</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Last restocked: {item.lastRestocked}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="hero" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setEditingItem(item);
                    setRestockAmount(5);
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Restock
                </Button>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Restock Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Restock {editingItem?.name}
            </DialogTitle>
            <DialogDescription>
              Current stock: {editingItem?.availableQuantity}/{editingItem?.totalQuantity}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Quantity to Add</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setRestockAmount(Math.max(1, restockAmount - 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center w-20"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setRestockAmount(restockAmount + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button variant="hero" className="flex-1" onClick={handleRestock}>
                Confirm Restock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminInventory;
