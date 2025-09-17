import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, Calendar, Leaf, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { harvestService, Harvest } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import QRPreview from '@/components/QRPreview';
import Navbar from '@/components/Navbar';

const HarvestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [harvest, setHarvest] = useState<Harvest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchHarvestDetail(id);
    }
  }, [id]);

  const fetchHarvestDetail = async (harvestId: string) => {
    try {
      setLoading(true);
      const data = await harvestService.getHarvestById(harvestId);
      setHarvest(data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching harvest detail:', err);
      setError(err.response?.data?.message || 'Failed to load harvest details');
      toast({
        title: "Error",
        description: "Failed to load harvest details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !harvest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
            
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-destructive">
                  {error || 'Harvest Not Found'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  The harvest you're looking for doesn't exist or couldn't be loaded.
                </p>
                <Button onClick={() => id && fetchHarvestDetail(id)} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Harvest Overview */}
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-3xl text-primary flex items-center space-x-3">
                    <Leaf className="h-8 w-8" />
                    <span>{harvest.cropName}</span>
                  </CardTitle>
                  <p className="text-lg text-muted-foreground">
                    Harvest Details & QR Code
                  </p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-lg px-4 py-2">
                  {harvest.unit}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-field/10 to-field/5 rounded-lg border border-field/20">
                  <Package className="h-8 w-8 text-field mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Quantity Harvested</p>
                  <p className="text-2xl font-bold text-field">
                    {harvest.quantity} {harvest.unit}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-earth/10 to-earth/5 rounded-lg border border-earth/20">
                  <MapPin className="h-8 w-8 text-earth mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-xl font-semibold text-earth">{harvest.location}</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-harvest/10 to-harvest/5 rounded-lg border border-harvest/20">
                  <Calendar className="h-8 w-8 text-harvest mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Harvest Date</p>
                  <p className="text-lg font-semibold text-harvest">
                    {formatDate(harvest.harvestDate)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Record Information</h4>
                  <div className="space-y-1 text-sm">
                    {harvest.createdAt && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Created:</span> {formatDateTime(harvest.createdAt)}
                      </p>
                    )}
                    {harvest.updatedAt && harvest.updatedAt !== harvest.createdAt && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Updated:</span> {formatDateTime(harvest.updatedAt)}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      <span className="font-medium">Harvest ID:</span> {harvest._id}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card className="shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Share This Harvest</CardTitle>
                <p className="text-muted-foreground">
                  Use the QR code below to let customers access this harvest information instantly
                </p>
              </CardHeader>
              <CardContent>
                <QRPreview 
                  harvestId={harvest._id!}
                  cropName={harvest.cropName}
                />
              </CardContent>
            </Card>

            <Card className="shadow-lg border-accent/10">
              <CardHeader>
                <CardTitle className="text-xl text-accent">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Generate QR Code</h4>
                    <p className="text-sm text-muted-foreground">
                      Each harvest gets a unique QR code that links to its details
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-field/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-field">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Share with Customers</h4>
                    <p className="text-sm text-muted-foreground">
                      Print or display the QR code on packaging or at markets
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-harvest/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-harvest">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Instant Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Customers scan to see harvest details, building trust and transparency
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HarvestDetail;