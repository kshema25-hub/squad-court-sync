import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CourtCard } from '@/components/courts/CourtCard';
import { courts } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Grid, List } from 'lucide-react';
import { motion } from 'framer-motion';

const Courts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const sports = [...new Set(courts.map((c) => c.sport))];

  const filteredCourts = courts.filter((court) => {
    const matchesSearch =
      court.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      court.sport.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = !selectedSport || court.sport === selectedSport;
    return matchesSearch && matchesSport;
  });

  return (
    <DashboardLayout
      title="Sports Courts"
      subtitle="Browse and book sports facilities across campus"
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
            placeholder="Search courts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedSport === null ? 'hero' : 'outline'}
            size="sm"
            onClick={() => setSelectedSport(null)}
          >
            All
          </Button>
          {sports.map((sport) => (
            <Button
              key={sport}
              variant={selectedSport === sport ? 'hero' : 'outline'}
              size="sm"
              onClick={() => setSelectedSport(sport)}
            >
              {sport}
            </Button>
          ))}
        </div>

        <div className="flex gap-1 border border-border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Results count */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-muted-foreground mb-6"
      >
        Showing {filteredCourts.length} of {courts.length} courts
      </motion.p>

      {/* Courts Grid */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }
      >
        {filteredCourts.map((court, index) => (
          <CourtCard key={court.id} court={court} index={index} />
        ))}
      </div>

      {filteredCourts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            No courts found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search query
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedSport(null);
            }}
          >
            Clear Filters
          </Button>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default Courts;
