// Mock data for the sports management system

export interface Court {
  id: string;
  name: string;
  sport: string;
  location: string;
  capacity: number;
  image: string;
  available: boolean;
  features: string[];
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  image: string;
  condition: 'good' | 'fair' | 'maintenance';
}

export interface Booking {
  id: string;
  courtId?: string;
  equipmentId?: string;
  userId: string;
  classId?: string;
  type: 'individual' | 'class';
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  sport: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  department: string;
  studentCount: number;
  coordinator: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  bookedBy?: string;
  bookingType?: 'individual' | 'class';
}

export const courts: Court[] = [
  {
    id: 'court-1',
    name: 'Indoor Basketball Court A',
    sport: 'Basketball',
    location: 'Sports Complex - Block A',
    capacity: 20,
    image: '/basketball-court.jpg',
    available: true,
    features: ['Indoor', 'Air Conditioned', 'LED Scoreboard', 'Spectator Seating'],
  },
  {
    id: 'court-2',
    name: 'Tennis Court 1',
    sport: 'Tennis',
    location: 'Outdoor Sports Area',
    capacity: 4,
    image: '/tennis-court.jpg',
    available: true,
    features: ['Outdoor', 'Synthetic Surface', 'Night Lights'],
  },
  {
    id: 'court-3',
    name: 'Badminton Hall',
    sport: 'Badminton',
    location: 'Sports Complex - Block B',
    capacity: 16,
    image: '/badminton-court.jpg',
    available: false,
    features: ['Indoor', '4 Courts', 'Wooden Flooring'],
  },
  {
    id: 'court-4',
    name: 'Football Field',
    sport: 'Football',
    location: 'Main Ground',
    capacity: 44,
    image: '/football-field.jpg',
    available: true,
    features: ['Outdoor', 'Natural Grass', 'Night Lights', 'Grandstand'],
  },
  {
    id: 'court-5',
    name: 'Volleyball Court',
    sport: 'Volleyball',
    location: 'Sports Complex - Block C',
    capacity: 24,
    image: '/volleyball-court.jpg',
    available: true,
    features: ['Indoor', 'Sprung Floor', 'Digital Scoreboard'],
  },
  {
    id: 'court-6',
    name: 'Swimming Pool',
    sport: 'Swimming',
    location: 'Aquatic Center',
    capacity: 50,
    image: '/swimming-pool.jpg',
    available: true,
    features: ['Indoor', 'Olympic Size', 'Heated', '8 Lanes'],
  },
];

export const equipment: Equipment[] = [
  {
    id: 'eq-1',
    name: 'Basketball',
    category: 'Ball Sports',
    totalQuantity: 25,
    availableQuantity: 18,
    image: '/basketball.jpg',
    condition: 'good',
  },
  {
    id: 'eq-2',
    name: 'Tennis Racket',
    category: 'Racket Sports',
    totalQuantity: 20,
    availableQuantity: 14,
    image: '/tennis-racket.jpg',
    condition: 'good',
  },
  {
    id: 'eq-3',
    name: 'Badminton Set',
    category: 'Racket Sports',
    totalQuantity: 15,
    availableQuantity: 8,
    image: '/badminton-set.jpg',
    condition: 'fair',
  },
  {
    id: 'eq-4',
    name: 'Football',
    category: 'Ball Sports',
    totalQuantity: 20,
    availableQuantity: 15,
    image: '/football.jpg',
    condition: 'good',
  },
  {
    id: 'eq-5',
    name: 'Volleyball',
    category: 'Ball Sports',
    totalQuantity: 12,
    availableQuantity: 10,
    image: '/volleyball.jpg',
    condition: 'good',
  },
  {
    id: 'eq-6',
    name: 'Swimming Goggles',
    category: 'Swimming',
    totalQuantity: 40,
    availableQuantity: 32,
    image: '/goggles.jpg',
    condition: 'good',
  },
  {
    id: 'eq-7',
    name: 'Cricket Kit',
    category: 'Cricket',
    totalQuantity: 8,
    availableQuantity: 5,
    image: '/cricket-kit.jpg',
    condition: 'fair',
  },
  {
    id: 'eq-8',
    name: 'Table Tennis Set',
    category: 'Racket Sports',
    totalQuantity: 10,
    availableQuantity: 7,
    image: '/tt-set.jpg',
    condition: 'good',
  },
];

export const classes: ClassInfo[] = [
  { id: 'CSE-2024-A', name: 'CSE 2024 - Section A', department: 'Computer Science', studentCount: 60, coordinator: 'Dr. Sharma' },
  { id: 'CSE-2024-B', name: 'CSE 2024 - Section B', department: 'Computer Science', studentCount: 58, coordinator: 'Dr. Patel' },
  { id: 'ECE-2024-A', name: 'ECE 2024 - Section A', department: 'Electronics', studentCount: 55, coordinator: 'Dr. Kumar' },
  { id: 'ME-2024-A', name: 'ME 2024 - Section A', department: 'Mechanical', studentCount: 62, coordinator: 'Dr. Singh' },
  { id: 'CE-2024-A', name: 'CE 2024 - Section A', department: 'Civil', studentCount: 50, coordinator: 'Dr. Reddy' },
];

export const upcomingBookings: Booking[] = [
  {
    id: 'bk-1',
    courtId: 'court-1',
    userId: 'user-1',
    classId: 'CSE-2024-A',
    type: 'class',
    date: '2026-01-15',
    startTime: '09:00',
    endTime: '11:00',
    status: 'approved',
    sport: 'Basketball',
  },
  {
    id: 'bk-2',
    courtId: 'court-2',
    userId: 'user-1',
    type: 'individual',
    date: '2026-01-14',
    startTime: '14:00',
    endTime: '15:00',
    status: 'pending',
    sport: 'Tennis',
  },
  {
    id: 'bk-3',
    equipmentId: 'eq-2',
    userId: 'user-1',
    type: 'individual',
    date: '2026-01-14',
    startTime: '14:00',
    endTime: '16:00',
    status: 'approved',
    sport: 'Tennis',
  },
];

export const generateTimeSlots = (date: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const times = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
  
  times.forEach((time, index) => {
    const random = Math.random();
    slots.push({
      id: `slot-${index}`,
      time,
      available: random > 0.3,
      bookedBy: random <= 0.3 ? (random < 0.15 ? 'CSE-2024-A' : 'Individual') : undefined,
      bookingType: random <= 0.3 ? (random < 0.15 ? 'class' : 'individual') : undefined,
    });
  });
  
  return slots;
};

export const sportIcons: Record<string, string> = {
  Basketball: '🏀',
  Tennis: '🎾',
  Badminton: '🏸',
  Football: '⚽',
  Volleyball: '🏐',
  Swimming: '🏊',
  Cricket: '🏏',
  'Table Tennis': '🏓',
};

export const currentUser = {
  id: 'user-1',
  name: 'Rahul Sharma',
  email: 'rahul.sharma@college.edu',
  classId: 'CSE-2024-A',
  role: 'student' as const,
  studentId: 'STU2024001',
  avatar: null,
};
