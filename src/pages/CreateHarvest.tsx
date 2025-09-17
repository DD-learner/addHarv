import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Package, MapPin, Leaf, CheckCircle, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { harvestService, Harvest } from '@/services/api';
import { offlineQueue, isOnline } from '@/utils/offlineQueue';
import Navbar from '@/components/Navbar';
import QRPreview from '@/components/QRPreview';
import { cn } from '@/lib/utils';

const harvestSchema = z.object({
  cropName: z.string().min(1, 'Crop name is required').max(100, 'Crop name too long'),
  quantity: z.number().min(0.1, 'Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  harvestDate: z.date({
    required_error: 'Harvest date is required',
  }),
  location: z.string().min(1, 'Location is required').max(200, 'Location too long'),
});

type HarvestForm = z.infer<typeof harvestSchema>;

const CreateHarvest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [createdHarvest, setCreatedHarvest] = useState<Harvest | null>(null);
  const [showQR, setShowQR] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<HarvestForm>({
    resolver: zodResolver(harvestSchema),
    defaultValues: {
      harvestDate: new Date(),
      unit: 'kg',
    },
  });

  const selectedDate = watch('harvestDate');

  const onSubmit = async (data: HarvestForm) => {
    setLoading(true);
    
    try {
      const harvestData: Omit<Harvest, '_id' | 'createdAt' | 'updatedAt'> = {
        cropName: data.cropName,
        quantity: data.quantity,
        unit: data.unit,
        location: data.location,
        harvestDate: data.harvestDate.toISOString(),
      };

      if (isOnline()) {
        // Online - submit directly
        const result = await harvestService.createHarvest(harvestData);
        setCreatedHarvest(result);
        setShowQR(true);
        
        toast({
          title: "Success!",
          description: `Harvest "${data.cropName}" has been recorded successfully.`,
        });
      } else {
        // Offline - queue for later sync
        const queueId = await offlineQueue.queueHarvest(harvestData);
        
        // Create a temporary harvest object for QR generation
        const tempHarvest: Harvest = {
          _id: queueId,
          ...harvestData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setCreatedHarvest(tempHarvest);
        setShowQR(true);
        
        toast({
          title: "Saved Offline",
          description: `Harvest "${data.cropName}" has been queued and will sync when online.`,
        });
      }
      
      // Reset form for next entry
      reset({
        cropName: '',
        quantity: 0,
        unit: 'kg',
        harvestDate: new Date(),
        location: '',
      });
      
    } catch (error: any) {
      console.error('Error creating harvest:', error);
      
      // If online request failed, try offline queue
      if (isOnline()) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to create harvest. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseQR = () => {
    setShowQR(false);
    setCreatedHarvest(null);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Auto-detect location using browser geolocation API
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location detection.",
        variant: "destructive",
      });
      return;
    }

    setLocationLoading(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use reverse geocoding to get address
      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=demo&limit=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const address = result.formatted || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setValue('location', address);
            
            toast({
              title: "Location detected",
              description: "Current location has been automatically filled.",
            });
          } else {
            // Fallback to coordinates if geocoding fails
            setValue('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            toast({
              title: "Location detected",
              description: "GPS coordinates have been automatically filled.",
            });
          }
        } else {
          // Fallback to coordinates if geocoding service fails
          setValue('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          toast({
            title: "Location detected",
            description: "GPS coordinates have been automatically filled.",
          });
        }
      } catch (geocodeError) {
        // Fallback to coordinates if geocoding fails
        setValue('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        toast({
          title: "Location detected",
          description: "GPS coordinates have been automatically filled.",
        });
      }
      
    } catch (error: any) {
      let errorMessage = "Unable to detect location.";
      
      if (error.code === 1) {
        errorMessage = "Location access denied. Please enable location permissions.";
      } else if (error.code === 2) {
        errorMessage = "Location unavailable. Please check your GPS settings.";
      } else if (error.code === 3) {
        errorMessage = "Location request timed out. Please try again.";
      }
      
      toast({
        title: "Location detection failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLocationLoading(false);
    }
  };

  // Units for different crop types
  const units = [
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'tons', label: 'Tons' },
    { value: 'lbs', label: 'Pounds (lbs)' },
    { value: 'bushels', label: 'Bushels' },
    { value: 'boxes', label: 'Boxes' },
    { value: 'crates', label: 'Crates' },
    { value: 'bags', label: 'Bags' },
  ];

  // Common crop suggestions
  const cropSuggestions = [
    'Tomatoes', 'Potatoes', 'Corn', 'Wheat', 'Rice', 'Soybeans', 
    'Carrots', 'Onions', 'Peppers', 'Lettuce', 'Spinach', 'Cabbage',
    'Apples', 'Oranges', 'Strawberries', 'Grapes'
  ];

  if (showQR && createdHarvest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto space-y-6">
            <Card className="text-center bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="pt-6">
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-primary mb-2">Harvest Recorded!</h2>
                <p className="text-muted-foreground mb-4">
                  Your harvest has been successfully recorded. Share the QR code below to let customers view the details.
                </p>
              </CardContent>
            </Card>
            
            <QRPreview 
              harvestId={createdHarvest._id!}
              cropName={createdHarvest.cropName}
              onClose={handleCloseQR}
            />
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleCloseQR} variant="outline" className="flex-1">
                Add Another Harvest
              </Button>
              <Button onClick={handleGoHome} className="flex-1">
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              Record New Harvest
            </h1>
            <p className="text-lg text-muted-foreground">
              Add your crop harvest details and generate a QR code for tracking
            </p>
          </div>

          {/* Form Card */}
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-6 w-6 text-primary" />
                <span>Harvest Information</span>
              </CardTitle>
              <CardDescription>
                Fill in the details about your harvest. All fields are required.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Crop Name */}
                <div className="space-y-2">
                  <Label htmlFor="cropName" className="flex items-center space-x-1">
                    <Leaf className="h-4 w-4" />
                    <span>Crop Name</span>
                  </Label>
                  <Input
                    id="cropName"
                    placeholder="Enter crop name (e.g., Tomatoes, Corn, etc.)"
                    {...register('cropName')}
                    className={errors.cropName ? 'border-destructive' : ''}
                    list="crop-suggestions"
                  />
                  <datalist id="crop-suggestions">
                    {cropSuggestions.map(crop => (
                      <option key={crop} value={crop} />
                    ))}
                  </datalist>
                  {errors.cropName && (
                    <p className="text-sm text-destructive">{errors.cropName.message}</p>
                  )}
                </div>

                {/* Quantity and Unit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      {...register('quantity', { valueAsNumber: true })}
                      className={errors.quantity ? 'border-destructive' : ''}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-destructive">{errors.quantity.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select onValueChange={(value) => setValue('unit', value)} defaultValue="kg">
                      <SelectTrigger className={errors.unit ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.unit && (
                      <p className="text-sm text-destructive">{errors.unit.message}</p>
                    )}
                  </div>
                </div>

                {/* Harvest Date */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Harvest Date</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground",
                          errors.harvestDate && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setValue('harvestDate', date)}
                        initialFocus
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.harvestDate && (
                    <p className="text-sm text-destructive">{errors.harvestDate.message}</p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>Field/Location</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      placeholder="Enter field name or location (e.g., North Field, Greenhouse 2)"
                      {...register('location')}
                      className={cn("flex-1", errors.location ? 'border-destructive' : '')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={detectLocation}
                      disabled={locationLoading}
                      title="Auto-detect current location"
                    >
                      {locationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Navigation className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Recording Harvest...' : 'Record Harvest'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Offline Notice */}
          {!isOnline() && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-2">
                  <div className="h-5 w-5 rounded-full bg-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      You're currently offline
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Don't worry! Your harvest will be saved locally and synced automatically when you're back online.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateHarvest;