
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, User, Lock } from 'lucide-react';

const Login = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await login(employeeId, password);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Logo */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
        <h1 className="text-5xl md:text-6xl font-bold text-primary">PTNG</h1>
      </div>
      
      {/* Login card */}
      <Card className="w-[350px] sm:w-[400px] shadow-elegant border-border bg-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl text-primary">Access Terminal</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  className="pl-10 rounded-md border-border bg-muted focus-visible:ring-primary/20 focus-visible:border-primary" 
                  type="text" 
                  placeholder="Employee ID" 
                  value={employeeId} 
                  onChange={e => setEmployeeId(e.target.value)} 
                  required 
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  className="pl-10 rounded-md border-border bg-muted focus-visible:ring-primary/20 focus-visible:border-primary" 
                  type="password" 
                  placeholder="Password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span>Authenticating...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Login <ChevronRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            <Link to="/forgot-password" className="text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
