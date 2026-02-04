import { forwardRef } from 'react';
import { format } from 'date-fns';
import { QrCode, Calendar, Clock, MapPin, Users, Package, CheckCircle } from 'lucide-react';

interface BookingPassProps {
  booking: {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    resource_type: string;
    quantity?: number | null;
    notes?: string | null;
    court?: {
      name: string;
      location: string;
      sport: string;
    } | null;
    equipment?: {
      name: string;
      category: string;
    } | null;
    class?: {
      name: string;
      class_id: string;
      department: string;
    } | null;
  };
  userName: string;
  approvedAt?: string;
}

export const BookingPass = forwardRef<HTMLDivElement, BookingPassProps>(
  ({ booking, userName, approvedAt }, ref) => {
    const bookingCode = booking.id.slice(0, 8).toUpperCase();
    const resourceName = booking.court?.name || booking.equipment?.name || 'Unknown';
    const location = booking.court?.location || booking.equipment?.category || '';

    return (
      <div
        ref={ref}
        className="w-[400px] bg-white text-gray-900 p-0 font-sans"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-6 text-center">
          <h1 className="text-2xl font-bold tracking-wide">BOOKING PASS</h1>
          <p className="text-emerald-100 text-sm mt-1">SquadSync Sports Facility</p>
        </div>

        {/* Booking Code */}
        <div className="bg-gray-100 p-4 text-center border-b-2 border-dashed border-gray-300">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Booking ID</p>
          <p className="text-3xl font-mono font-bold text-emerald-600 tracking-widest">
            {bookingCode}
          </p>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold uppercase text-sm">Approved</span>
            </div>
          </div>

          {/* Resource Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {booking.resource_type === 'court' ? (
                <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
              ) : (
                <Package className="w-5 h-5 text-emerald-600 mt-0.5" />
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase">
                  {booking.resource_type === 'court' ? 'Court' : 'Equipment'}
                </p>
                <p className="font-bold text-lg text-gray-900">{resourceName}</p>
                {location && <p className="text-sm text-gray-600">{location}</p>}
                {booking.quantity && booking.quantity > 1 && (
                  <p className="text-sm text-gray-600">Quantity: {booking.quantity}</p>
                )}
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs uppercase">Date</span>
              </div>
              <p className="font-semibold text-gray-900">
                {format(new Date(booking.start_time), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs uppercase">Time</span>
              </div>
              <p className="font-semibold text-gray-900">
                {format(new Date(booking.start_time), 'h:mm a')} -{' '}
                {format(new Date(booking.end_time), 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Class/User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Booked By</p>
                <p className="font-bold text-gray-900">{userName}</p>
                {booking.class && (
                  <>
                    <p className="text-sm text-gray-600">
                      {booking.class.name} ({booking.class.class_id})
                    </p>
                    <p className="text-sm text-gray-500">{booking.class.department}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="flex justify-center py-2">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200 mx-auto">
                <QrCode className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 mt-2">Scan to verify</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 text-center border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Approved on {approvedAt ? format(new Date(approvedAt), 'MMM dd, yyyy h:mm a') : format(new Date(), 'MMM dd, yyyy h:mm a')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Present this pass to the facility manager
          </p>
        </div>
      </div>
    );
  }
);

BookingPass.displayName = 'BookingPass';
