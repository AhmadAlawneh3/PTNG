
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminInitializer } from '@/components/admin/AdminInitializer';
import { toast } from '@/components/ui/sonner';
import { authService } from '@/services/authService';

const AdminSetup = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin already exists to prevent creating multiple admins
    const checkAdminExists = async () => {
      try {
        const exists = await authService.checkAdminExists();
        
        if (exists) {
          setAdminExists(true);
          toast.error("Admin already exists", {
            description: "An admin user has already been created. Please use the login page.",
          });
          // Redirect to login after a short delay
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error) {
        
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminExists();
  }, [navigate]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        {/* Logo */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-600">PTNG</h1>
        </div>
        
        <div className="bg-white shadow-md p-8 rounded-lg text-center">
          <div className="animate-pulse text-blue-600 text-xl">Checking system status...</div>
        </div>
      </div>
    );
  }

  // Show admin already exists message
  if (adminExists) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        {/* Logo */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-600">PTNG</h1>
        </div>
        
        <div className="bg-white shadow-md p-8 rounded-lg text-center">
          <h2 className="text-xl text-blue-600 mb-4">Admin Already Exists</h2>
          <p className="text-gray-600 mb-4">
            An admin user has already been created for this system. 
            You will be redirected to the login page.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show admin setup form
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      {/* Logo */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-600">PTNG</h1>
      </div>
      
      <AdminInitializer />
    </div>
  );
};

export default AdminSetup;
