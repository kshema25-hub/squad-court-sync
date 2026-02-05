import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Dumbbell, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/courts', label: 'Courts' },
  { href: '/equipment', label: 'Equipment' },
  { href: '/dashboard', label: 'Dashboard' },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setIsOpen(false);
    navigate('/');
    setSigningOut(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              SportSync
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button
                  variant="ghost"
                  className={`${
                    location.pathname === link.href
                      ? 'text-primary bg-primary/10'
                      : ''
                  }`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {profile?.full_name || user.email}
                </span>
                <Link to="/dashboard">
                  <Button variant="hero">Dashboard</Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/admin/login">
                  <Button variant="outline" size="sm">Admin</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border"
          >
            <div className="container px-6 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={`px-4 py-3 rounded-lg ${
                      location.pathname === link.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    {link.label}
                  </div>
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      Signed in as {profile?.full_name || user.email}
                    </div>
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="hero" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleSignOut}
                      disabled={signingOut}
                    >
                      {signingOut ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4 mr-2" />
                      )}
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/admin/login" onClick={() => setIsOpen(false)}>
                      <Button variant="secondary" className="w-full">
                        Admin Login
                      </Button>
                    </Link>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="hero" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
