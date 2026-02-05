 import { useState } from 'react';
import { useEffect } from 'react';
 import { motion } from 'framer-motion';
 import { Link, useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Shield, ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';
 import { toast } from 'sonner';
 import { supabase } from '@/integrations/supabase/client';
 
 // Demo admin credentials - in production, these would be in secure storage
 const DEMO_ADMIN_EMAIL = 'admin@squadsync.demo';
 const DEMO_ADMIN_PASSWORD = 'admin123';
 
 const AdminAuth = () => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const navigate = useNavigate();
 
  // Setup admin on page load
  useEffect(() => {
    const setupAdmin = async () => {
      try {
        await supabase.functions.invoke('setup-admin');
      } catch (err) {
        console.log('Admin setup check completed');
      }
    };
    setupAdmin();
  }, []);

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSubmitting(true);
 
     try {
       // Check demo credentials
       if (email === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD) {
         // Sign in with the demo admin account
         const { error } = await supabase.auth.signInWithPassword({
           email: DEMO_ADMIN_EMAIL,
           password: DEMO_ADMIN_PASSWORD,
         });
 
         if (error) {
           // If admin doesn't exist, show setup message
           if (error.message.includes('Invalid login credentials')) {
             toast.error('Admin account not set up', {
               description: 'Please run the test setup first at /test-setup',
             });
           } else {
             toast.error(error.message);
           }
           return;
         }
 
         toast.success('Welcome, Administrator!', {
           description: 'You have successfully logged in.',
         });
         navigate('/admin');
       } else {
         // Try regular sign in for other admin accounts
         const { data, error } = await supabase.auth.signInWithPassword({
           email,
           password,
         });
 
         if (error) {
           toast.error('Invalid credentials', {
             description: 'Please check your email and password.',
           });
           return;
         }
 
         // Check if user is admin
         const { data: roleData } = await supabase
           .from('user_roles')
           .select('role')
           .eq('user_id', data.user.id)
           .maybeSingle();
 
         if (roleData?.role !== 'admin') {
           await supabase.auth.signOut();
           toast.error('Access denied', {
             description: 'This login is for administrators only.',
           });
           return;
         }
 
         toast.success('Welcome, Administrator!');
         navigate('/admin');
       }
     } catch (err) {
       console.error('Admin auth error:', err);
       toast.error('An unexpected error occurred');
     } finally {
       setIsSubmitting(false);
     }
   };
 
   return (
     <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6 relative overflow-hidden">
       {/* Background elements */}
       <div className="absolute inset-0 overflow-hidden">
         <motion.div
           className="absolute top-20 left-10 w-72 h-72 bg-destructive/10 rounded-full blur-3xl"
           animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
           transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
         />
         <motion.div
           className="absolute bottom-20 right-10 w-96 h-96 bg-warning/10 rounded-full blur-3xl"
           animate={{ x: [0, -30, 0], y: [0, -50, 0] }}
           transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
         />
       </div>
 
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="w-full max-w-md relative z-10"
       >
         {/* Back link */}
         <Link
           to="/"
           className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
         >
           <ArrowLeft className="w-4 h-4" />
           Back to Home
         </Link>
 
         {/* Card */}
         <div className="glass rounded-2xl p-8">
           {/* Header */}
           <div className="text-center mb-8">
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive to-warning flex items-center justify-center mx-auto mb-4">
               <Shield className="w-8 h-8 text-white" />
             </div>
             <h1 className="font-display text-2xl font-bold text-foreground mb-2">
               Admin Portal
             </h1>
             <p className="text-muted-foreground">
               Sign in to manage courts, equipment, and approvals
             </p>
           </div>
 
           {/* Demo credentials hint */}
           <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
             <p className="text-sm text-warning font-medium mb-2">Demo Credentials:</p>
             <div className="text-xs text-muted-foreground space-y-1 font-mono">
               <p>Email: admin@squadsync.demo</p>
               <p>Password: admin123</p>
             </div>
           </div>
 
           {/* Form */}
           <form onSubmit={handleSubmit} className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="email">Admin Email</Label>
               <div className="relative">
                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input
                   id="email"
                   type="email"
                   placeholder="admin@squadsync.demo"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="pl-10 bg-secondary border-border"
                   disabled={isSubmitting}
                 />
               </div>
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="password">Password</Label>
               <div className="relative">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input
                   id="password"
                   type="password"
                   placeholder="••••••••"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="pl-10 bg-secondary border-border"
                   disabled={isSubmitting}
                 />
               </div>
             </div>
 
             <Button
               type="submit"
               className="w-full bg-gradient-to-r from-destructive to-warning hover:opacity-90"
               size="lg"
               disabled={isSubmitting}
             >
               {isSubmitting ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Signing In...
                 </>
               ) : (
                 <>
                   <Shield className="mr-2 h-4 w-4" />
                   Sign In as Admin
                 </>
               )}
             </Button>
           </form>
 
           {/* Student login link */}
           <div className="mt-6 text-center text-sm">
             <span className="text-muted-foreground">Are you a class representative?</span>{' '}
             <Link to="/auth" className="text-primary font-medium hover:underline">
               Student Login
             </Link>
           </div>
         </div>
       </motion.div>
     </div>
   );
 };
 
 export default AdminAuth;