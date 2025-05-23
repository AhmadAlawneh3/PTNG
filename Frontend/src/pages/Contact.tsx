
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Send, User } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Message Sent",
        description: "Your message has been received. Our team will get back to you shortly.",
      });
      
      setName('');
      setEmail('');
      setMessage('');
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background effects */}
      <div className="cyber-grid-bg" />
      <div className="scan-line animate-scan-line" />
      
      {/* Logo */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <h1 className="text-4xl md:text-5xl neon-blue font-black tracking-wider">PTNG</h1>
        <p className="text-sm md:text-base text-cyber-teal text-center">QUANTUM-SECURE DESKTOP NEXUS</p>
      </div>
      
      {/* Contact card */}
      <Card className="w-[350px] sm:w-[450px] glass-panel border-cyber-teal/30">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-cyber-teal">Contact Support</CardTitle>
          <CardDescription className="text-center text-cyber-gray">
            Send a message to our support team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-cyber-blue/70" />
                <Input
                  className="pl-10 bg-cyber-dark-blue/50 border-cyber-teal/30 text-cyber-teal focus:border-cyber-blue focus:ring-cyber-blue"
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-cyber-blue/70" />
                <Input
                  className="pl-10 bg-cyber-dark-blue/50 border-cyber-teal/30 text-cyber-teal focus:border-cyber-blue focus:ring-cyber-blue"
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Textarea
                  className="min-h-[120px] bg-cyber-dark-blue/50 border-cyber-teal/30 text-cyber-teal focus:border-cyber-blue focus:ring-cyber-blue"
                  placeholder="Your Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              <Button 
                className="w-full cyber-button group" 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-pulse">Sending...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Send Message <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link 
            to="/login" 
            className="flex items-center text-cyber-blue hover:text-cyber-teal transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Contact;
