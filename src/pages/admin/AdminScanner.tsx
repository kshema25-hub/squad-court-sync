import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  RotateCcw,
  History,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type VerificationResult = {
  status: 'valid' | 'invalid' | 'expired' | 'not_approved';
  booking?: any;
  message: string;
};

type ScanHistoryEntry = {
  id: string;
  scannedAt: Date;
  result: VerificationResult;
  bookingCode: string;
  resourceName: string;
  userName: string;
};

const statusConfig = {
  valid: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10 border-success/30', label: 'Verified ✓' },
  invalid: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', label: 'Invalid' },
  expired: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10 border-warning/30', label: 'Expired' },
  not_approved: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10 border-warning/30', label: 'Not Approved' },
};

const ScanHistoryLog = ({ 
  history, 
  onClear 
}: { 
  history: ScanHistoryEntry[]; 
  onClear: () => void;
}) => {
  if (history.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-card rounded-xl border border-border overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Scan History</h3>
          <Badge variant="secondary" className="text-xs">{history.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>

      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {history.map((entry, index) => {
            const config = statusConfig[entry.result.status];
            const Icon = config.icon;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground truncate">
                      {entry.resourceName}
                    </p>
                    <Badge className={`text-[10px] px-1.5 py-0 ${config.bg}`}>
                      {config.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{entry.userName}</span>
                    <span>·</span>
                    <span className="font-mono">{entry.bookingCode}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {format(entry.scannedAt, 'h:mm:ss a')}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const AdminScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  const scannerRef = useRef<any>(null);
  const scannerContainerId = 'qr-scanner-container';

  const addToHistory = useCallback((verResult: VerificationResult) => {
    const entry: ScanHistoryEntry = {
      id: crypto.randomUUID(),
      scannedAt: new Date(),
      result: verResult,
      bookingCode: verResult.booking?.id?.slice(0, 8).toUpperCase() || 'N/A',
      resourceName: verResult.booking?.court?.name || verResult.booking?.equipment?.name || 'Unknown',
      userName: verResult.booking?.profile?.full_name || 'Unknown',
    };
    setScanHistory(prev => [entry, ...prev].slice(0, 50));
  }, []);

  const verifyBooking = useCallback(async (data: string) => {
    setLoading(true);
    setError(null);
    let verResult: VerificationResult;
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.type !== 'squadsync_booking' || !parsed.id) {
        verResult = { status: 'invalid', message: 'This QR code is not a valid SquadSync booking pass.' };
        setResult(verResult);
        addToHistory(verResult);
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
        verResult = { status: 'invalid', message: 'Booking not found in the system.' };
        setResult(verResult);
        addToHistory(verResult);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', booking.user_id)
        .single();

      const bookingWithProfile = { ...booking, profile };

      if (booking.status !== 'approved') {
        verResult = {
          status: 'not_approved',
          booking: bookingWithProfile,
          message: `Booking status is "${booking.status}". Only approved bookings are valid.`,
        };
        setResult(verResult);
        addToHistory(verResult);
        return;
      }

      const now = new Date();
      const endTime = new Date(booking.end_time);
      if (endTime < now) {
        verResult = {
          status: 'expired',
          booking: bookingWithProfile,
          message: 'This booking has expired. The scheduled time has passed.',
        };
        setResult(verResult);
        addToHistory(verResult);
        return;
      }

      verResult = {
        status: 'valid',
        booking: bookingWithProfile,
        message: 'Booking verified successfully! This pass is valid.',
      };
      setResult(verResult);
      addToHistory(verResult);
    } catch {
      verResult = { status: 'invalid', message: 'Could not read QR code data. Invalid format.' };
      setResult(verResult);
      addToHistory(verResult);
    } finally {
      setLoading(false);
    }
  }, [addToHistory]);

  const startScanner = useCallback(async () => {
    setResult(null);
    setError(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
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
        () => {}
      );
    } catch (err: any) {
      setScanning(false);
      setError(err?.message || 'Failed to access camera. Please allow camera permissions.');
    }
  }, [verifyBooking]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
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

            {result.booking && (
              <div className="bg-gradient-card rounded-xl border border-border p-5 space-y-4">
                <h4 className="font-display font-semibold text-foreground">Booking Details</h4>
                <div className="grid gap-3">
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

        {/* Scan History */}
        <ScanHistoryLog 
          history={scanHistory} 
          onClear={() => setScanHistory([])} 
        />
      </div>
    </AdminLayout>
  );
};

export default AdminScanner;
