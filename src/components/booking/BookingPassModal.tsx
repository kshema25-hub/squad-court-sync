import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookingPass } from './BookingPass';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface BookingPassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  } | null;
  userName: string;
  approvedAt?: string;
}

export const BookingPassModal = ({
  open,
  onOpenChange,
  booking,
  userName,
  approvedAt,
}: BookingPassModalProps) => {
  const passRef = useRef<HTMLDivElement>(null);

  if (!booking) return null;

  const handlePrint = () => {
    if (!passRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the pass');
      return;
    }

    const passHtml = passRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Booking Pass - ${booking.id.slice(0, 8).toUpperCase()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              padding: 20px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div style="width: 400px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            ${passHtml}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownload = async () => {
    if (!passRef.current) return;

    try {
      // Create a canvas from the pass element
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(passRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to generate pass image');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `booking-pass-${booking.id.slice(0, 8).toUpperCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Pass downloaded successfully!');
      }, 'image/png');
    } catch (error) {
      console.error('Error downloading pass:', error);
      toast.error('Failed to download pass');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Booking Pass</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <div className="border border-border rounded-lg overflow-hidden shadow-lg">
            <BookingPass
              ref={passRef}
              booking={booking}
              userName={userName}
              approvedAt={approvedAt}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-center pt-4 border-t border-border">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Pass
          </Button>
          <Button variant="hero" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
