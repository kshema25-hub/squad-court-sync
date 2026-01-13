// Admin mock data

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  classId: string;
  role: 'student' | 'faculty' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  joinedAt: string;
  bookingsCount: number;
  penaltiesCount: number;
}

export interface PendingBooking {
  id: string;
  userId: string;
  userName: string;
  userClass: string;
  courtName?: string;
  equipmentName?: string;
  type: 'court' | 'equipment';
  bookingType: 'individual' | 'class';
  date: string;
  startTime: string;
  endTime: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  issuedQuantity: number;
  damagedQuantity: number;
  lostQuantity: number;
  lastRestocked: string;
  condition: 'good' | 'fair' | 'needs-attention';
}

export const adminUsers: AdminUser[] = [
  { id: 'u1', name: 'Rahul Sharma', email: 'rahul.sharma@college.edu', classId: 'CSE-2024-A', role: 'student', status: 'active', joinedAt: '2024-08-15', bookingsCount: 12, penaltiesCount: 0 },
  { id: 'u2', name: 'Priya Patel', email: 'priya.patel@college.edu', classId: 'CSE-2024-B', role: 'student', status: 'active', joinedAt: '2024-08-15', bookingsCount: 8, penaltiesCount: 1 },
  { id: 'u3', name: 'Amit Kumar', email: 'amit.kumar@college.edu', classId: 'ECE-2024-A', role: 'student', status: 'suspended', joinedAt: '2024-08-16', bookingsCount: 5, penaltiesCount: 3 },
  { id: 'u4', name: 'Sneha Reddy', email: 'sneha.reddy@college.edu', classId: 'ME-2024-A', role: 'student', status: 'active', joinedAt: '2024-08-16', bookingsCount: 15, penaltiesCount: 0 },
  { id: 'u5', name: 'Dr. Sharma', email: 'dr.sharma@college.edu', classId: 'FACULTY', role: 'faculty', status: 'active', joinedAt: '2024-01-10', bookingsCount: 45, penaltiesCount: 0 },
  { id: 'u6', name: 'Vikram Singh', email: 'vikram.singh@college.edu', classId: 'CE-2024-A', role: 'student', status: 'pending', joinedAt: '2026-01-12', bookingsCount: 0, penaltiesCount: 0 },
  { id: 'u7', name: 'Ananya Gupta', email: 'ananya.gupta@college.edu', classId: 'CSE-2024-A', role: 'student', status: 'active', joinedAt: '2024-08-15', bookingsCount: 20, penaltiesCount: 0 },
  { id: 'u8', name: 'Sports Admin', email: 'admin@college.edu', classId: 'ADMIN', role: 'admin', status: 'active', joinedAt: '2023-01-01', bookingsCount: 0, penaltiesCount: 0 },
];

export const pendingBookings: PendingBooking[] = [
  { id: 'pb1', userId: 'u1', userName: 'Rahul Sharma', userClass: 'CSE-2024-A', courtName: 'Indoor Basketball Court A', type: 'court', bookingType: 'class', date: '2026-01-15', startTime: '09:00', endTime: '11:00', requestedAt: '2026-01-13 10:30', status: 'pending' },
  { id: 'pb2', userId: 'u2', userName: 'Priya Patel', userClass: 'CSE-2024-B', courtName: 'Tennis Court 1', type: 'court', bookingType: 'individual', date: '2026-01-14', startTime: '14:00', endTime: '15:00', requestedAt: '2026-01-13 09:15', status: 'pending' },
  { id: 'pb3', userId: 'u4', userName: 'Sneha Reddy', userClass: 'ME-2024-A', equipmentName: 'Cricket Kit', type: 'equipment', bookingType: 'class', date: '2026-01-16', startTime: '10:00', endTime: '12:00', requestedAt: '2026-01-13 11:00', status: 'pending' },
  { id: 'pb4', userId: 'u7', userName: 'Ananya Gupta', userClass: 'CSE-2024-A', courtName: 'Swimming Pool', type: 'court', bookingType: 'individual', date: '2026-01-14', startTime: '16:00', endTime: '17:00', requestedAt: '2026-01-13 08:45', status: 'pending' },
  { id: 'pb5', userId: 'u5', userName: 'Dr. Sharma', userClass: 'FACULTY', courtName: 'Football Field', type: 'court', bookingType: 'class', date: '2026-01-17', startTime: '08:00', endTime: '10:00', requestedAt: '2026-01-12 15:30', status: 'pending' },
];

export const inventoryItems: InventoryItem[] = [
  { id: 'inv1', name: 'Basketball', category: 'Ball Sports', totalQuantity: 25, availableQuantity: 18, issuedQuantity: 5, damagedQuantity: 1, lostQuantity: 1, lastRestocked: '2025-12-01', condition: 'good' },
  { id: 'inv2', name: 'Tennis Racket', category: 'Racket Sports', totalQuantity: 20, availableQuantity: 14, issuedQuantity: 4, damagedQuantity: 2, lostQuantity: 0, lastRestocked: '2025-11-15', condition: 'good' },
  { id: 'inv3', name: 'Badminton Set', category: 'Racket Sports', totalQuantity: 15, availableQuantity: 8, issuedQuantity: 5, damagedQuantity: 1, lostQuantity: 1, lastRestocked: '2025-10-20', condition: 'fair' },
  { id: 'inv4', name: 'Football', category: 'Ball Sports', totalQuantity: 20, availableQuantity: 15, issuedQuantity: 3, damagedQuantity: 2, lostQuantity: 0, lastRestocked: '2025-12-10', condition: 'good' },
  { id: 'inv5', name: 'Volleyball', category: 'Ball Sports', totalQuantity: 12, availableQuantity: 10, issuedQuantity: 2, damagedQuantity: 0, lostQuantity: 0, lastRestocked: '2025-12-05', condition: 'good' },
  { id: 'inv6', name: 'Swimming Goggles', category: 'Swimming', totalQuantity: 40, availableQuantity: 32, issuedQuantity: 6, damagedQuantity: 1, lostQuantity: 1, lastRestocked: '2025-11-20', condition: 'good' },
  { id: 'inv7', name: 'Cricket Kit', category: 'Cricket', totalQuantity: 8, availableQuantity: 5, issuedQuantity: 2, damagedQuantity: 1, lostQuantity: 0, lastRestocked: '2025-09-15', condition: 'needs-attention' },
  { id: 'inv8', name: 'Table Tennis Set', category: 'Racket Sports', totalQuantity: 10, availableQuantity: 7, issuedQuantity: 2, damagedQuantity: 1, lostQuantity: 0, lastRestocked: '2025-11-01', condition: 'fair' },
];

export const analyticsData = {
  courtUtilization: [
    { name: 'Basketball', bookings: 145, hours: 290 },
    { name: 'Tennis', bookings: 98, hours: 147 },
    { name: 'Badminton', bookings: 120, hours: 180 },
    { name: 'Football', bookings: 65, hours: 195 },
    { name: 'Swimming', bookings: 180, hours: 180 },
    { name: 'Volleyball', bookings: 55, hours: 110 },
  ],
  monthlyBookings: [
    { month: 'Aug', individual: 120, class: 45 },
    { month: 'Sep', individual: 180, class: 65 },
    { month: 'Oct', individual: 220, class: 80 },
    { month: 'Nov', individual: 195, class: 72 },
    { month: 'Dec', individual: 150, class: 50 },
    { month: 'Jan', individual: 85, class: 35 },
  ],
  peakHours: [
    { hour: '06:00', bookings: 15 },
    { hour: '07:00', bookings: 25 },
    { hour: '08:00', bookings: 45 },
    { hour: '09:00', bookings: 60 },
    { hour: '10:00', bookings: 55 },
    { hour: '11:00', bookings: 40 },
    { hour: '12:00', bookings: 20 },
    { hour: '13:00', bookings: 25 },
    { hour: '14:00', bookings: 50 },
    { hour: '15:00', bookings: 65 },
    { hour: '16:00', bookings: 70 },
    { hour: '17:00', bookings: 80 },
    { hour: '18:00', bookings: 75 },
    { hour: '19:00', bookings: 55 },
    { hour: '20:00', bookings: 30 },
  ],
  equipmentUsage: [
    { name: 'Basketball', usage: 85 },
    { name: 'Tennis Racket', usage: 70 },
    { name: 'Badminton Set', usage: 78 },
    { name: 'Football', usage: 60 },
    { name: 'Volleyball', usage: 45 },
    { name: 'Swimming Goggles', usage: 55 },
    { name: 'Cricket Kit', usage: 40 },
    { name: 'Table Tennis', usage: 65 },
  ],
};
