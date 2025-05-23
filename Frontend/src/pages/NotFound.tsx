
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="text-center glass-panel p-8 max-w-md relative overflow-hidden dark-card">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle size={48} className="text-destructive animate-pulse" />
          </div>
        </div>
        
        <h1 className="text-6xl font-black mb-4 text-primary animate-pulse">404</h1>
        <p className="text-xl text-primary-foreground mb-6">Access Denied: Resource Not Found</p>
        
        <Alert variant="destructive" className="mb-6 bg-destructive/10 border-destructive/30">
          <AlertDescription className="text-center text-foreground">
            The requested resource cannot be found. Please return to a secure area.
          </AlertDescription>
        </Alert>
        
        {/* Decorative border elements */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary/30"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary/30"></div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground group w-full sm:w-auto">
              Return to Login
              <span className="ml-2 text-xs group-hover:text-primary-foreground/80 transition-colors">[secure]</span>
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="border-primary/30 hover:bg-primary/10 text-foreground w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            Previous Location
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
