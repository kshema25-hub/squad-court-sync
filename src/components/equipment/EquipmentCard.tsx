import { motion } from 'framer-motion';
import { Package, AlertTriangle, Check } from 'lucide-react';
import { Equipment, sportIcons } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface EquipmentCardProps {
  equipment: Equipment;
  index: number;
  onRequest: (equipment: Equipment) => void;
}

export const EquipmentCard = ({ equipment, index, onRequest }: EquipmentCardProps) => {
  const availabilityPercent = (equipment.availableQuantity / equipment.totalQuantity) * 100;

  const conditionColors = {
    good: 'bg-success/20 text-success border-success/30',
    fair: 'bg-warning/20 text-warning border-warning/30',
    maintenance: 'bg-destructive/20 text-destructive border-destructive/30',
  };

  const conditionIcons = {
    good: Check,
    fair: AlertTriangle,
    maintenance: AlertTriangle,
  };

  const ConditionIcon = conditionIcons[equipment.condition];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-gradient-card rounded-xl p-5 border border-border hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <Package className="w-7 h-7 text-primary" />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-display font-semibold text-foreground">
                {equipment.name}
              </h4>
              <p className="text-sm text-muted-foreground">{equipment.category}</p>
            </div>
            <Badge className={conditionColors[equipment.condition]}>
              <ConditionIcon className="w-3 h-3 mr-1" />
              {equipment.condition.charAt(0).toUpperCase() + equipment.condition.slice(1)}
            </Badge>
          </div>

          {/* Availability bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Availability</span>
              <span className="font-medium text-foreground">
                {equipment.availableQuantity}/{equipment.totalQuantity}
              </span>
            </div>
            <Progress value={availabilityPercent} className="h-2" />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="hero"
              size="sm"
              className="flex-1"
              disabled={equipment.availableQuantity === 0}
              onClick={() => onRequest(equipment)}
            >
              Request
            </Button>
            <Button variant="outline" size="sm">
              Details
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
