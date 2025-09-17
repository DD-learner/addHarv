import { Link, useLocation } from 'react-router-dom';
import { Leaf, Home, Plus, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getOfflineStatus } from '@/utils/offlineQueue';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const location = useLocation();
  const [offlineStatus, setOfflineStatus] = useState(getOfflineStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setOfflineStatus(getOfflineStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-primary rounded-lg group-hover:bg-primary/90 transition-colors">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">FarmTracker</h1>
              <p className="text-xs text-muted-foreground">Harvest Management</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>
            </Link>
            <Link to="/create-harvest">
              <Button
                variant={isActive('/create-harvest') ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Harvest</span>
              </Button>
            </Link>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {offlineStatus.isOnline ? (
                <div className="flex items-center space-x-1 text-primary">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:block">Online</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-destructive">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:block">Offline</span>
                </div>
              )}
              
              {offlineStatus.queueLength > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {offlineStatus.queueLength} pending
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-center space-x-2 pb-3">
          <Link to="/">
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </Link>
          <Link to="/create-harvest">
            <Button
              variant={isActive('/create-harvest') ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Harvest</span>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;