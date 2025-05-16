import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

interface GoogleSignInProps {
  onLoginSuccess?: () => void;
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onLoginSuccess }) => {
  const handleGoogleSignIn = async () => {
    try {
      console.log("Google sign-in initiated");
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      // provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
      
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful');
      
      if (onLoginSuccess && result.user) {
        console.log("Login success callback executed");
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      alert(`Sign-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <button
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        color: '#111827',
        border: '1px solid #dcfce7',
        borderRadius: '6px',
        padding: '0.8rem 1.5rem',
        fontSize: '1rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        width: '250px',
        margin: '0 auto',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
      onClick={handleGoogleSignIn}
    >
      <img 
        src="https://developers.google.com/identity/images/g-logo.png" 
        alt="Google Logo" 
        style={{
          height: '20px',
          marginRight: '10px'
        }}
        onError={(e) => e.currentTarget.style.display = 'none'}
      />
      <span>Sign in with Google</span>
    </button>
  );
};

export default GoogleSignIn; 