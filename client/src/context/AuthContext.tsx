import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithGoogle, 
  emailSignIn, 
  emailSignUp, 
  resetPassword, 
  logOut,
  type User, 
  type UserCredential 
} from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<UserCredential | undefined>;
  signInWithEmail: (email: string, password: string) => Promise<UserCredential | undefined>;
  signUpWithEmail: (email: string, password: string) => Promise<UserCredential | undefined>;
  resetPassword: (email: string) => Promise<void | undefined>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const handleSignInWithGoogle = async (): Promise<UserCredential | undefined> => {
    try {
      setError(null);
      return await signInWithGoogle();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Authentication Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return undefined;
    }
  };

  // Sign in with email and password
  const handleSignInWithEmail = async (email: string, password: string): Promise<UserCredential | undefined> => {
    try {
      setError(null);
      return await emailSignIn(email, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Authentication Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return undefined;
    }
  };

  // Sign up with email and password
  const handleSignUpWithEmail = async (email: string, password: string): Promise<UserCredential | undefined> => {
    try {
      setError(null);
      return await emailSignUp(email, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Authentication Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return undefined;
    }
  };

  // Reset password
  const handleResetPassword = async (email: string): Promise<void | undefined> => {
    try {
      setError(null);
      await resetPassword(email);
      toast({
        title: 'Password Reset',
        description: 'Check your email for a password reset link',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Password Reset Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return undefined;
    }
  };

  // Logout
  const handleLogout = async (): Promise<void> => {
    try {
      await logOut();
      setCurrentUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Logout Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    resetPassword: handleResetPassword,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;