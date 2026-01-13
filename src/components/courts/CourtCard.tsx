import { motion } from 'framer-motion';
import { MapPin, Users, Check, X } from 'lucide-react';
import { Court, sportIcons } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface CourtCardProps {
  court: Court;
  index: number;
}

export const CourtCard = ({ court, index }: CourtCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group bg-gradient-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-glow"
    >
      {/* Image placeholder */}
      <div className="relative h-48 bg-secondary overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-6xl">{sportIcons[court.sport] || '🏟️'}</span>
        </div>
        <div className="absolute top-3 right-3">
          <Badge
            className={
              court.available
                ? 'bg-success/90 text-success-foreground'
                : 'bg-destructive/90 text-destructive-foreground'
            }
          >
            {court.available ? (
              <>
                <Check className="w-3 h-3 mr-1" /> Available
              </>
            ) : (
              <>
                <X className="w-3 h-3 mr-1" /> Booked
              </>
            )}
          </Badge>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {court.name}
        </h3>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4" />
          {court.location}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Users className="w-4 h-4" />
          Up to {court.capacity} players
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {court.features.slice(0, 3).map((feature) => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
          {court.features.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{court.features.length - 3} more
            </Badge>
          )}
        </div>

        <Link to={`/courts/${court.id}`}>
          <Button
            variant={court.available ? 'hero' : 'outline'}
            className="w-full"
            disabled={!court.available}
          >
            {court.available ? 'Book Now' : 'View Schedule'}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};
