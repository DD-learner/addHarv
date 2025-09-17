import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QRPreviewProps {
  harvestId: string;
  cropName: string;
  onClose?: () => void;
}

const QRPreview = ({ harvestId, cropName, onClose }: QRPreviewProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Generate the harvest URL (this would be your customer app URL)
  const harvestUrl = `https://customer-app.farmtracker.com/harvest/${harvestId}`;

  useEffect(() => {
    generateQRCode();
  }, [harvestId]);

  const generateQRCode = async () => {
    try {
      const qrUrl = await QRCode.toDataURL(harvestUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#22c55e', // Primary green color
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `harvest-${harvestId}-qr.png`;
    link.href = qrCodeUrl;
    link.click();
    
    toast({
      title: "Downloaded",
      description: "QR code saved to your device",
    });
  };

  const copyHarvestUrl = async () => {
    try {
      await navigator.clipboard.writeText(harvestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied",
        description: "Harvest URL copied to clipboard",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Harvest QR Code - ${cropName}`,
          text: `Check out this harvest: ${cropName}`,
          url: harvestUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      copyHarvestUrl();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader className="text-center">
        <CardTitle className="text-primary flex items-center justify-center space-x-2">
          <span>Harvest QR Code</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Scan to view harvest details for <span className="font-medium text-primary">{cropName}</span>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg shadow-sm border-2 border-primary/10">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt={`QR Code for ${cropName} harvest`}
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 bg-muted animate-pulse rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Generating...</span>
              </div>
            )}
          </div>
        </div>

        {/* Harvest URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Harvest URL:</label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-2 bg-muted rounded text-sm text-muted-foreground font-mono break-all">
              {harvestUrl}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyHarvestUrl}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={downloadQRCode}
            variant="outline"
            className="flex-1 bg-primary/5 border-primary/20 hover:bg-primary/10"
            disabled={!qrCodeUrl}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          
          <Button
            onClick={shareQRCode}
            variant="outline"
            className="flex-1 bg-accent/5 border-accent/20 hover:bg-accent/10"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {onClose && (
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QRPreview;