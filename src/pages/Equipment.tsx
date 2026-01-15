import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { useEquipment } from '@/hooks/useResources';
import { useUserClass } from '@/hooks/useClasses';
import { useCreateEquipmentBooking } from '@/hooks/useBookingMutations';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tables } from '@/integrations/supabase/types';
import { addDays } from 'date-fns';

type Equipment = Tables<'equipment'>;

const EquipmentPage = () => {
  const { user } = useAuth();
  const { data: equipment = [], isLoading } = useEquipment();
  const { data: userClass } = useUserClass(user?.id);
  const createBooking = useCreateEquipmentBooking();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [bookingType, setBookingType] = useState<'individual' | 'class'>('individual');
  const [quantity, setQuantity] = useState(1);

  const categories = [...new Set(equipment.map((e) => e.category))];

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRequest = (item: Equipment) => {
    setSelectedEquipment(item);
    setQuantity(1);
    setBookingType('individual');
  };

  const submitRequest = async () => {
    if (!selectedEquipment || !user) return;

    // Default to 7-day equipment loan period
    const startTime = new Date();
    const endTime = addDays(startTime, 7);

    await createBooking.mutateAsync({
      equipmentId: selectedEquipment.id,
      userId: user.id,
      classId: bookingType === 'class' && userClass ? userClass.id : undefined,
      bookingType,
      quantity,
      startTime,
      endTime,
    });

    setSelectedEquipment(null);
  };

  return (
    <DashboardLayout
      title="Sports Equipment"
      subtitle="Request equipment for individual or class use"
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
      </motion.div>

      {/* Results count */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-muted-foreground mb-6"
      >
        {isLoading ? 'Loading...' : `Showing ${filteredEquipment.length} of ${equipment.length} items`}
      </motion.p>

      {/* Equipment Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map((item, index) => (
          <EquipmentCard
            key={item.id}
            equipment={{
              id: item.id,
              name: item.name,
              category: item.category,
              availableQuantity: item.available_quantity,
              totalQuantity: item.total_quantity,
              condition: item.condition,
              image: item.image_url || undefined,
            }}
            index={index}
            onRequest={() => handleRequest(item)}
          />
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            No equipment found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search query
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
          >
            Clear Filters
          </Button>
        </motion.div>
      )}

      {/* Request Dialog */}
      <Dialog open={!!selectedEquipment} onOpenChange={() => setSelectedEquipment(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Request {selectedEquipment?.name}
            </DialogTitle>
            <DialogDescription>
              Available: {selectedEquipment?.available_quantity} of{' '}
              {selectedEquipment?.total_quantity}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Booking Type */}
            <div className="space-y-3">
              <Label className="text-foreground">Booking Type</Label>
              <RadioGroup
                value={bookingType}
                onValueChange={(v) => setBookingType(v as 'individual' | 'class')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="cursor-pointer">
                    Individual
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="class" id="class" disabled={!userClass} />
                  <Label htmlFor="class" className="cursor-pointer">
                    {userClass ? `Class (${userClass.name})` : 'No class assigned'}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Quantity */}
            <div className="space-y-3">
              <Label className="text-foreground">Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="font-display text-2xl font-bold w-12 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setQuantity(
                      Math.min(selectedEquipment?.available_quantity || 1, quantity + 1)
                    )
                  }
                  disabled={quantity >= (selectedEquipment?.available_quantity || 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedEquipment(null)}
                disabled={createBooking.isPending}
              >
                Cancel
              </Button>
              <Button 
                variant="hero" 
                className="flex-1" 
                onClick={submitRequest}
                disabled={createBooking.isPending}
              >
                {createBooking.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EquipmentPage;
