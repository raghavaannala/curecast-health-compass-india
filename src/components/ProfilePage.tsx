import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface UserProfile {
  name: string;
  age: string;
  gender: string;
  bloodGroup: string;
  allergies: string;
  emergencyContact: string;
  location: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<Notification>({
    message: '',
    type: 'success',
    visible: false
  });
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: '',
    gender: '',
    bloodGroup: '',
    allergies: '',
    emergencyContact: '',
    location: ''
  });

  const [formData, setFormData] = useState<UserProfile>(profile);

  // Fetch user profile data from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        if (auth.currentUser) {
          console.log("Fetching profile for user:", auth.currentUser.uid);
          const userDocRef = doc(db, "userProfiles", auth.currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            console.log("Found existing profile data");
            const userData = docSnap.data() as UserProfile;
            setProfile(userData);
            setFormData(userData);
          } else {
            // No profile exists yet, use default empty profile
            console.log("No profile found - new user");
            if (auth.currentUser.displayName) {
              const initialProfile = {
                ...profile,
                name: auth.currentUser.displayName || ''
              };
              setProfile(initialProfile);
              setFormData(initialProfile);
              
              // Create an initial profile document
              try {
                await setDoc(userDocRef, initialProfile);
                console.log("Created initial profile document");
              } catch (err) {
                console.error("Failed to create initial profile:", err);
              }
            }
          }
        } else {
          console.log("User not logged in, cannot fetch profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        showNotification(`Failed to load profile data: ${errorMessage}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [auth.currentUser, db]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type, visible: true });
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData(profile);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (auth.currentUser) {
        // Save profile data to Firestore
        const userDocRef = doc(db, "userProfiles", auth.currentUser.uid);
        console.log("Saving profile for user:", auth.currentUser.uid);
        console.log("Profile data:", formData);
        
        try {
          await setDoc(userDocRef, formData, { merge: true });
          console.log("Profile saved successfully");
          
          setProfile(formData);
          setIsEditing(false);
          showNotification('Profile saved successfully!', 'success');
        } catch (error: any) {
          console.error("Error in Firestore operation:", error);
          
          // Check for permission denied error (common if Firestore rules are not set up correctly)
          if (error.code === 'permission-denied') {
            showNotification('Permission denied. Database rules may need to be updated.', 'error');
          } else {
            const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
            showNotification(`Database error: ${errorMessage}`, 'error');
          }
        }
      } else {
        console.error("Cannot save profile: User not logged in");
        showNotification('You need to be logged in to save your profile', 'error');
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      // Show more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showNotification(`Failed to save profile: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px'}}>
        <div style={{color: '#15803d', textAlign: 'center'}}>
          <div style={{fontSize: '24px', marginBottom: '10px'}}>Loading profile...</div>
          <div style={{width: '50px', height: '50px', border: '5px solid #dcfce7', borderTopColor: '#15803d', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite'}}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container" style={{maxWidth: '800px', margin: '0 auto'}}>
      {notification.visible && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: notification.type === 'success' ? '#15803d' : '#dc2626',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '4px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>{notification.type === 'success' ? '✅' : '❌'}</span>
            <span>{notification.message}</span>
          </div>
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
      
      <div className="profile-header" style={{textAlign: 'center', marginBottom: '2.5rem', position: 'relative'}}>
        <h2 style={{color: '#166534', fontSize: '1.75rem', marginBottom: '0.5rem'}}>My Health Profile</h2>
        <p style={{color: '#4b5563'}}>Manage your personal health information</p>
        <div style={{
          content: '',
          position: 'absolute',
          width: '80px',
          height: '3px',
          background: 'linear-gradient(to right, #22c55e, #166534)',
          bottom: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: '9999px'
        }}></div>
      </div>

      <div className="profile-content">
        {!isEditing ? (
          <div className="profile-details">
            <div className="profile-avatar" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem'}}>
              <div className="avatar-placeholder" style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.75rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                boxShadow: '0 10px 25px -5px rgba(21, 128, 61, 0.2), 0 8px 10px -6px rgba(21, 128, 61, 0.1)',
                border: '3px solid white'
              }}>
                {profile.name.charAt(0) || "?"}
              </div>
              <h3 style={{fontSize: '1.5rem', color: '#111827'}}>{profile.name || "Your Name"}</h3>
            </div>
            
            <div className="profile-info-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2.5rem'
            }}>
              <div className="profile-info-item" style={{
                backgroundColor: 'white',
                padding: '1.25rem',
                borderRadius: '8px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                border: '1px solid #dcfce7'
              }}>
                <h4 style={{color: '#166534', marginBottom: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'relative', display: 'inline-block'}}>Age</h4>
                <p style={{color: '#111827', fontWeight: 500, fontSize: '1.1rem'}}>{profile.age ? `${profile.age} years` : "Not specified"}</p>
              </div>
              <div className="profile-info-item" style={{
                backgroundColor: 'white',
                padding: '1.25rem',
                borderRadius: '8px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                border: '1px solid #dcfce7'
              }}>
                <h4 style={{color: '#166534', marginBottom: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'relative', display: 'inline-block'}}>Gender</h4>
                <p style={{color: '#111827', fontWeight: 500, fontSize: '1.1rem'}}>{profile.gender || "Not specified"}</p>
              </div>
              <div className="profile-info-item" style={{
                backgroundColor: 'white',
                padding: '1.25rem',
                borderRadius: '8px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                border: '1px solid #dcfce7'
              }}>
                <h4 style={{color: '#166534', marginBottom: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'relative', display: 'inline-block'}}>Blood Group</h4>
                <p style={{color: '#111827', fontWeight: 500, fontSize: '1.1rem'}}>{profile.bloodGroup || "Not specified"}</p>
              </div>
              <div className="profile-info-item" style={{
                backgroundColor: 'white',
                padding: '1.25rem',
                borderRadius: '8px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                border: '1px solid #dcfce7'
              }}>
                <h4 style={{color: '#166534', marginBottom: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'relative', display: 'inline-block'}}>Allergies</h4>
                <p style={{color: '#111827', fontWeight: 500, fontSize: '1.1rem'}}>{profile.allergies || 'None'}</p>
              </div>
              <div className="profile-info-item" style={{
                backgroundColor: 'white',
                padding: '1.25rem',
                borderRadius: '8px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                border: '1px solid #dcfce7'
              }}>
                <h4 style={{color: '#166534', marginBottom: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'relative', display: 'inline-block'}}>Emergency Contact</h4>
                <p style={{color: '#111827', fontWeight: 500, fontSize: '1.1rem'}}>{profile.emergencyContact || "Not specified"}</p>
              </div>
              <div className="profile-info-item" style={{
                backgroundColor: 'white',
                padding: '1.25rem',
                borderRadius: '8px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                border: '1px solid #dcfce7'
              }}>
                <h4 style={{color: '#166534', marginBottom: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'relative', display: 'inline-block'}}>Location</h4>
                <p style={{color: '#111827', fontWeight: 500, fontSize: '1.1rem'}}>{profile.location || "Not specified"}</p>
              </div>
            </div>
            
            <div className="profile-actions" style={{display: 'flex', justifyContent: 'center', marginTop: '1.5rem'}}>
              <button onClick={handleEdit} className="edit-profile-button" style={{
                backgroundColor: '#15803d',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 500,
                minWidth: '150px'
              }}>
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-edit-form" style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '650px',
            margin: '0 auto'
          }}>
            <div className="form-group" style={{marginBottom: '1.75rem'}}>
              <label htmlFor="name" style={{display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontWeight: 500, fontSize: '0.95rem'}}>Full Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange}
                placeholder="Enter your full name"
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  backgroundColor: '#f9fafb',
                  color: '#111827'
                }}
              />
            </div>
            
            <div className="form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem'}}>
              <div className="form-group">
                <label htmlFor="age" style={{display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontWeight: 500, fontSize: '0.95rem'}}>Age</label>
                <input 
                  type="text" 
                  id="age" 
                  name="age" 
                  value={formData.age} 
                  onChange={handleChange}
                  placeholder="Enter your age"
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    backgroundColor: '#f9fafb',
                    color: '#111827'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="gender" style={{display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontWeight: 500, fontSize: '0.95rem'}}>Gender</label>
                <select 
                  id="gender" 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    backgroundColor: '#f9fafb',
                    color: '#111827'
                  }}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="form-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem'}}>
              <div className="form-group">
                <label htmlFor="bloodGroup" style={{display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontWeight: 500, fontSize: '0.95rem'}}>Blood Group</label>
                <select 
                  id="bloodGroup" 
                  name="bloodGroup" 
                  value={formData.bloodGroup} 
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    backgroundColor: '#f9fafb',
                    color: '#111827'
                  }}
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="allergies" style={{display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontWeight: 500, fontSize: '0.95rem'}}>Allergies</label>
                <input 
                  type="text" 
                  id="allergies" 
                  name="allergies" 
                  value={formData.allergies} 
                  onChange={handleChange}
                  placeholder="Enter allergies or 'None'"
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    backgroundColor: '#f9fafb',
                    color: '#111827'
                  }}
                />
              </div>
            </div>
            
            <div className="form-group" style={{marginBottom: '1.75rem'}}>
              <label htmlFor="emergencyContact" style={{display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontWeight: 500, fontSize: '0.95rem'}}>Emergency Contact</label>
              <input 
                type="text" 
                id="emergencyContact" 
                name="emergencyContact" 
                value={formData.emergencyContact} 
                onChange={handleChange}
                placeholder="Enter emergency contact number"
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  backgroundColor: '#f9fafb',
                  color: '#111827'
                }}
              />
            </div>
            
            <div className="form-group" style={{marginBottom: '1.75rem'}}>
              <label htmlFor="location" style={{display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontWeight: 500, fontSize: '0.95rem'}}>Location</label>
              <input 
                type="text" 
                id="location" 
                name="location" 
                value={formData.location} 
                onChange={handleChange}
                placeholder="Enter your location"
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  backgroundColor: '#f9fafb',
                  color: '#111827'
                }}
              />
            </div>
            
            <div className="form-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '1.25rem', marginTop: '2.5rem'}}>
              <button onClick={() => setIsEditing(false)} className="cancel-button" style={{
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 500,
                minWidth: '120px'
              }}>
                Cancel
              </button>
              <button onClick={handleSave} className="save-button" style={{
                backgroundColor: '#15803d',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 500,
                minWidth: '120px'
              }}>
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 