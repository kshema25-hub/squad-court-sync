import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ScanLine, 
  Camera, 
  CameraOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  Clock,
  Package,
  MapPin,
  Users,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type VerificationResult = {
  status: 'valid' | 'invalid' | 'expired' | 'not_approved';
  booking?: any;
  message: string;
};

const AdminScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const scannerContainerId = 'qr-scanner-container';

  const verifyBooking = useCallback(async (data: string) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.type !== 'squadsync_booking' || !parsed.id) {
        setResult({ status: 'invalid', message: 'This QR code is not a valid SquadSync booking pass.' });
        return;
      }

      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          court:courts(*),
          equipment:equipment(*),
          class:classes(*)
        `)
        .eq('id', parsed.id)
        .single();

      if (fetchError || !booking) {
        setResult({ status: 'invalid', message: 'Booking not found in the system.' });
        return;
      }

      // Fetch profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', booking.user_id)
        .single();

      const bookingWithProfile = { ...booking, profile };

      if (booking.status !== 'approved') {
        setResult({
          status: 'not_approved',
          booking: bookingWithProfile,
          message: `Booking status is "${booking.status}". Only approved bookings are valid.`,
        });
        return;
      }

      const now = new Date();
      const endTime = new Date(booking.end_time);
      if (endTime < now) {
        setResult({
          status: 'expired',
          booking: bookingWithProfile,
          message: 'This booking has expired. The scheduled time has passed.',
        });
        return;
      }

      setResult({
        status: 'valid',
        booking: bookingWithProfile,
        message: 'Booking verified successfully! This pass is valid.',
      });
    } catch {
      setResult({ status: 'invalid', message: 'Could not read QR code data. Invalid format.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    setResult(null);
    setError(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Small delay for DOM
      await new Promise(r => setTimeout(r, 100));
      
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          setScanning(false);
          verifyBooking(decodedText);
        },
        () => {} // ignore errors during scanning
      );
    } catch (err: any) {
      setScanning(false);
      setError(err?.message || 'Failed to access camera. Please allow camera permissions.');
    }
  }, [verifyBooking]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const resetScanner = () => {
    setResult(null);
    setError(null);
  };

  const statusConfig = {
    valid: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10 border-success/30', label: 'Valid' },
    invalid: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', label: 'Invalid' },
    expired: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10 border-warning/30', label: 'Expired' },
    not_approved: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10 border-warning/30', label: 'Not Approved' },
  };

  return (
    <AdminLayout title="QR Scanner" subtitle="Scan booking passes to verify court and equipment reservations">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Scanner Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-card rounded-xl border border-border overflow-hidden"
        >
          <div className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <ScanLine className="w-6 h-6 text-primary" />
              <h2 className="font-display text-xl font-semibold text-foreground">Booking Pass Scanner</h2>
            </div>

            {/* Scanner viewport */}
            <div className="relative mx-auto w-full max-w-sm aspect-square bg-muted rounded-xl overflow-hidden mb-4">
              <div id={scannerContainerId} className="w-full h-full" />
              {!scanning && !result && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Camera className="w-16 h-16 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Camera preview will appear here</p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-destructive flex items-center gap-2">
                  <CameraOff className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            <div className="flex justify-center gap-3">
              {!scanning && !result && (
                <Button variant="hero" size="lg" onClick={startScanner}>
                  <Camera className="w-5 h-5 mr-2" />
                  Start Scanning
                </Button>
              )}
              {scanning && (
                <Button variant="outline" size="lg" onClick={stopScanner}>
                  <CameraOff className="w-5 h-5 mr-2" />
                  Stop Scanner
                </Button>
              )}
              {result && (
                <Button variant="hero" size="lg" onClick={() => { resetScanner(); startScanner(); }}>
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Scan Another
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-card rounded-xl border border-border p-8 text-center"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Verifying booking...</p>
          </motion.div>
        )}

        {/* Verification Result */}
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Status Banner */}
            {(() => {
              const config = statusConfig[result.status];
              const Icon = config.icon;
              return (
                <div className={`rounded-xl border p-5 ${config.bg}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`w-7 h-7 ${config.color} shrink-0 mt-0.5`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-display text-lg font-bold ${config.color}`}>{config.label}</h3>
                        <Badge className={config.bg}>{result.status}</Badge>
                      </div>
                      <p className="text-sm text-foreground/80">{result.message}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Booking Details */}
            {result.booking && (
              <div className="bg-gradient-card rounded-xl border border-border p-5 space-y-4">
                <h4 className="font-display font-semibold text-foreground">Booking Details</h4>

                <div className="grid gap-3">
                  {/* Resource */}
                  <div className="flex items-start gap-3 bg-secondary/50 rounded-lg p-3">
                    {result.booking.resource_type === 'court' ? (
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    ) : (
                      <Package className="w-5 h-5 text-accent mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">
                        {result.booking.resource_type === 'court' ? 'Court' : 'Equipment'}
                      </p>
                      <p className="font-semibold text-foreground">
                        {result.booking.court?.name || result.booking.equipment?.name || 'Unknown'}
                      </p>
                      {result.booking.court?.location && (
                        <p className="text-sm text-muted-foreground">{result.booking.court.location}</p>
                      )}
                      {result.booking.quantity && result.booking.quantity > 1 && (
                        <p className="text-sm text-muted-foreground">Quantity: {result.booking.quantity}</p>
                      )}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs uppercase">Date</span>
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        {format(new Date(result.booking.start_time), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs uppercase">Time</span>
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        {format(new Date(result.booking.start_time), 'h:mm a')} - {format(new Date(result.booking.end_time), 'h:mm a')}
                      </p>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex items-start gap-3 bg-secondary/50 rounded-lg p-3">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Booked By</p>
                      <p className="font-semibold text-foreground">
                        {result.booking.profile?.full_name || 'Unknown User'}
                      </p>
                      {result.booking.class && (
                        <p className="text-sm text-muted-foreground">
                          {result.booking.class.name} ({result.booking.class.class_id}) · {result.booking.class.department}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Booking ID */}
                  <div className="text-center pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Booking ID</p>
                    <p className="font-mono font-bold text-primary tracking-widest">
                      {result.booking.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminScanner;
