import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dumbbell, ArrowLeft, Mail, Lock, User, GraduationCap, Loader2, KeyRound, Building, Users, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  className: z.string().min(2, 'Class name is required'),
  classIdCode: z.string().min(2, 'Class ID is required'),
  department: z.string().min(2, 'Department is required'),
  year: z.number().min(1).max(6),
  studentCount: z.number().min(1),
});

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  classCode: z.string().min(6, 'Class code is required'),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [className, setClassName] = useState('');
  const [classIdCode, setClassIdCode] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState<number>(1);
  const [studentCount, setStudentCount] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    setErrors({});
    
    try {
      if (isLogin) {
        signInSchema.parse({ email, password, classCode });
      } else {
        signUpSchema.parse({ 
          email, 
          password, 
          name, 
          className, 
          classIdCode, 
          department, 
          year, 
          studentCount 
        });
      }
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        // First validate the class code
        const { data: validationData, error: validationError } = await supabase.functions.invoke(
          'validate-class-login',
          {
            body: { email, class_code: classCode },
          }
        );

        if (validationError || !validationData?.valid) {
          toast.error(validationData?.error || 'Invalid class code or email');
          setIsSubmitting(false);
          return;
        }

        // Now sign in with email and password
        const { error } = await signIn(email, password);
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Please verify your email before logging in');
          } else {
            toast.error(error.message);
          }
          return;
        }
        
        toast.success('Welcome back!', {
          description: `Signed in as class representative for ${validationData.class_name}`,
        });
      } else {
        // Register new class
        const { data, error } = await supabase.functions.invoke('register-class', {
          body: {
            email,
            password,
            full_name: name,
            class_name: className,
            class_id_code: classIdCode,
            department,
            year,
            student_count: studentCount,
          },
        });

        if (error || data?.error) {
          toast.error(data?.error || error?.message || 'Registration failed');
          return;
        }
        
        toast.success('Class registered successfully!', {
          description: `Your class code has been sent to ${email}. Check your inbox!`,
          duration: 8000,
        });
        
        // Show the class code in the UI as well
        toast.info(`Your Class Code: ${data.class_code}`, {
          description: 'Save this code - you need it to login!',
          duration: 15000,
        });
        
        setIsLogin(true);
        setPassword('');
        setClassCode(data.class_code);
      }
    } catch (err) {
      console.error('Auth error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              {isLogin ? 'Class Representative Login' : 'Register Your Class'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? 'Sign in with your class code to manage bookings'
                : 'Register as class representative to book courts and equipment'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Representative Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`pl-10 bg-secondary border-border ${errors.name ? 'border-destructive' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="className">Class Name</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="className"
                        type="text"
                        placeholder="CSE-A"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className={`pl-10 bg-secondary border-border ${errors.className ? 'border-destructive' : ''}`}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.className && <p className="text-sm text-destructive">{errors.className}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="classIdCode">Class ID</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="classIdCode"
                        type="text"
                        placeholder="4AI23CD"
                        value={classIdCode}
                        onChange={(e) => setClassIdCode(e.target.value.toUpperCase())}
                        className={`pl-10 bg-secondary border-border ${errors.classIdCode ? 'border-destructive' : ''}`}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.classIdCode && <p className="text-sm text-destructive">{errors.classIdCode}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="department"
                      type="text"
                      placeholder="Computer Science"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className={`pl-10 bg-secondary border-border ${errors.department ? 'border-destructive' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.department && <p className="text-sm text-destructive">{errors.department}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentCount">Students</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="studentCount"
                        type="number"
                        placeholder="30"
                        value={studentCount}
                        onChange={(e) => setStudentCount(parseInt(e.target.value) || 0)}
                        className="pl-10 bg-secondary border-border"
                        disabled={isSubmitting}
                        min={1}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 bg-secondary border-border ${errors.email ? 'border-destructive' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {isLogin && (
              <div className="space-y-2">
                <Label htmlFor="classCode">Class Code</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="classCode"
                    type="text"
                    placeholder="ABC123"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    className={`pl-10 bg-secondary border-border uppercase tracking-widest font-mono ${errors.classCode ? 'border-destructive' : ''}`}
                    disabled={isSubmitting}
                    maxLength={6}
                  />
                </div>
                {errors.classCode && <p className="text-sm text-destructive">{errors.classCode}</p>}
                <p className="text-xs text-muted-foreground">Enter the 6-character code sent to your email</p>
              </div>
            )}

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
                  className={`pl-10 bg-secondary border-border ${errors.password ? 'border-destructive' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button 
              type="submit" 
              variant="hero" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Registering Class...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Register Class'
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "Need to register your class?" : 'Already have a class code?'}
            </span>{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-primary font-medium hover:underline"
              disabled={isSubmitting}
            >
              {isLogin ? 'Register' : 'Sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;