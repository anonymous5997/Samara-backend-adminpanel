'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/client';
import { toast } from 'sonner';

export function GoogleSignInButton() {
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);

      const user = result.user;
      console.log('Google user:', user);

      toast.success(`Welcome ${user.displayName}`);
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full bg-white text-black py-3 rounded-lg font-semibold"
    >
      Continue with Google
    </button>
  );
}
