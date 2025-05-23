
// Note: This is an example file since ForgotPassword.tsx is read-only
// To implement this, you'll need to create a new component or get permission to edit the existing one

import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/services/authService';
import { toast } from '@/components/ui/sonner';

// This component would handle both requesting a password reset and setting a new password
const ForgotPassword = () => {
  const { token } = useParams(); // If token is present, we're resetting the password
  const [employeeId, setEmployeeId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await authService.requestPasswordReset(employeeId);
      toast("Reset Link Sent", {
        description: response.message,
      });
      
      // For demo purposes, if a reset_link is returned, show it
      if (response.reset_link) {
        
      }
    } catch (error: any) {
      toast.error("Request Failed", {
        description: error.response?.data?.message || "Failed to request password reset.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error("Invalid Token", {
        description: "No reset token provided.",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords Don't Match", {
        description: "The passwords you entered don't match.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await authService.resetPassword(token, newPassword);
      toast("Password Reset", {
        description: response.message,
      });
      
      // Redirect to login after successful reset
      navigate('/login');
    } catch (error: any) {
      toast.error("Reset Failed", {
        description: error.response?.data?.message || "Failed to reset password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background effects */}
      <div className="cyber-grid-bg" />
      <div className="scan-line animate-scan-line" />
      
      {/* Card */}
      <Card className="w-[350px] sm:w-[400px] glass-panel border-cyber-teal/30">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-cyber-teal">
            {token ? "Reset Password" : "Forgot Password"}
          </CardTitle>
          <CardDescription className="text-center text-cyber-gray">
            {token 
              ? "Enter your new password below" 
              : "Enter your employee ID and we'll send you a reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            // Reset password form
            <form onSubmit={handleResetPassword}>
              <div className="space-y-4">
                <div>
                  <Input 
                    className="bg-cyber-dark-blue/50 border-cyber-teal/30 text-cyber-teal" 
                    type="password" 
                    placeholder="New Password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <Input 
                    className="bg-cyber-dark-blue/50 border-cyber-teal/30 text-cyber-teal" 
                    type="password" 
                    placeholder="Confirm Password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>
                <Button className="w-full cyber-button" type="submit" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Reset Password"}
                </Button>
              </div>
            </form>
          ) : (
            // Request reset form
            <form onSubmit={handleRequestReset}>
              <div className="space-y-4">
                <div>
                  <Input 
                    className="bg-cyber-dark-blue/50 border-cyber-teal/30 text-cyber-teal" 
                    type="text" 
                    placeholder="Employee ID" 
                    value={employeeId} 
                    onChange={e => setEmployeeId(e.target.value)} 
                    required 
                  />
                </div>
                <Button className="w-full cyber-button" type="submit" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Send Reset Link"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/login" className="text-cyber-blue hover:underline text-sm">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
