import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Harvest, harvestService } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Package, MapPin, Calendar, TrendingUp, Leaf, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getOfflineStatus } from '@/utils/offlineQueue';
import Navbar from '@/components/Navbar';

const Home = () => {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const offlineStatus = getOfflineStatus();

  useEffect(() => {
    fetchHarvests();
  }, []);

  const fetchHarvests = async () => {
    try {
      setLoading(true);
      const data = await harvestService.getAllHarvests();
      setHarvests(data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching harvests:', err);
      setError(err.response?.data?.message || 'Failed to load harvests');
      
      if (!navigator.onLine) {
        toast({
          title: "Offline Mode",
          description: "Showing cached data. New harvests will sync when online.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load harvests. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalQuantity = () => {
    return harvests.reduce((total, harvest) => total + harvest.quantity, 0);
  };

  const getUniqueFields = () => {
    return new Set(harvests.map(h => h.location)).size;
  };

  const getMostRecentHarvest = () => {
    if (harvests.length === 0) return null;
    return harvests.reduce((latest, current) => 
      new Date(current.harvestDate) > new Date(latest.harvestDate) ? current : latest
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-field bg-clip-text text-transparent">
            Welcome to FarmTracker
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your harvests, track your crops, and grow your farm business with confidence
          </p>
        </div>

        {/* Offline Status Banner */}
        {!offlineStatus.isOnline && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="flex items-center space-x-2 pt-4">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800 dark:text-amber-200">
                You're offline. {offlineStatus.queueLength > 0 && `${offlineStatus.queueLength} harvests queued for sync.`}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary rounded-lg">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Harvests</p>
                  <p className="text-2xl font-bold text-primary">{harvests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-field/10 to-field/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-field rounded-lg">
                  <TrendingUp className="h-5 w-5 text-field-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Quantity</p>
                  <p className="text-2xl font-bold text-field">{getTotalQuantity()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-earth/10 to-earth/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-earth rounded-lg">
                  <MapPin className="h-5 w-5 text-earth-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fields</p>
                  <p className="text-2xl font-bold text-earth">{getUniqueFields()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-harvest/10 to-harvest/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-harvest rounded-lg">
                  <Calendar className="h-5 w-5 text-harvest-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Latest Harvest</p>
                  <p className="text-lg font-bold text-harvest">
                    {getMostRecentHarvest() ? formatDate(getMostRecentHarvest()!.harvestDate) : 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Your Harvests</h2>
            <p className="text-muted-foreground">Track and manage all your crop harvests</p>
          </div>
          <Link to="/create-harvest">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <Plus className="h-5 w-5 mr-2" />
              Add New Harvest
            </Button>
          </Link>
        </div>

        {/* Harvests Grid */}
        {error && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-destructive font-medium">{error}</p>
              <Button 
                onClick={fetchHarvests} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {harvests.length === 0 && !loading && !error ? (
          <Card className="text-center py-12">
            <CardContent>
              <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No harvests recorded yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by adding your first harvest to track your farm's productivity
              </p>
              <Link to="/create-harvest">
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Harvest
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {harvests.map((harvest) => (
              <Card 
                key={harvest._id} 
                className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/40 hover:border-l-primary"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-primary flex items-center space-x-2">
                        <Leaf className="h-5 w-5" />
                        <span>{harvest.cropName}</span>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Harvested on {formatDate(harvest.harvestDate)}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {harvest.unit}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quantity:</span>
                    <span className="font-semibold text-lg text-field">
                      {harvest.quantity} {harvest.unit}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{harvest.location}</span>
                  </div>
                  
                  {harvest._id && (
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-primary/20 hover:bg-primary/5"
                        asChild
                      >
                        <Link to={`/harvest/${harvest._id}`}>
                          View Details & QR Code
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;