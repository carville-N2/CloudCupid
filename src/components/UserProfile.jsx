import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate instead of useHistory
import Loading from './Loading'; // Import the Loading component
import './UserProfile.css'; // Import the UserProfile CSS file

const RIA_URI = "https://prod-14.northcentralus.logic.azure.com/workflows/f39f317737ea435681f5da04bde43476/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/profiles/{id}?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=-K-x0oN-krttKOovd8JTMHQ908pWZSUWkmfYk0dODmA";
const DELETE_PROFILE_URI = "https://prod-21.northcentralus.logic.azure.com/workflows/687188a6f9854b76b1b0fe43c300a49d/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/profiles/{id}?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=unXgxhoOZ3A61NrvWLrMOjsAD8zwv7_XsRdVSO7O3os"; // Delete Profile URI
const EDIT_PROFILE_URI = "https://prod-20.northcentralus.logic.azure.com/workflows/a7fa383d57fa4315b707a93641c68fc2/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/profiles/{id}?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=Xqp6LODbVUMpaX2UUSk-u01UZrOVa08fCe-OUao4zgo"; // Edit Profile URI

const UserProfilePage = () => {
  const { id } = useParams(); // Get the profile ID from the URL
  const [profile, setProfile] = useState(null); // State for the profile data
  const [imageUrl, setImageUrl] = useState(null); // State for the image URL
  const [loading, setLoading] = useState(true); // State for loading indicator
  const [error, setError] = useState(null); // State for error handling
  const [isEditing, setIsEditing] = useState(false); // State to toggle between edit and view mode
  const [successMessage, setSuccessMessage] = useState(''); // State for success message
  const navigate = useNavigate(); // Use useNavigate for navigation after deletion

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(RIA_URI.replace("{id}", id)); // Replace {id} with the actual profile ID
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setProfile(data);
        setImageUrl(data.imageUrl); // Assuming the API returns an `imageUrl` field
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  // Handle profile deletion
  const handleDeleteProfile = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this profile?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(DELETE_PROFILE_URI.replace("{id}", id), {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Profile deleted successfully');
        navigate('/'); // Redirect to homepage after deletion
      } else {
        throw new Error('Failed to delete profile');
      }
    } catch (error) {
      setError(error.message); // Show error if deletion fails
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      const updatedProfile = {
        ProfileID: profile.ProfileID, // Ensure ProfileID is included
        ProfileLabel: profile.ProfileLabel, // Updated profile label
        UserName: profile.UserName,
        UserFullName: profile.UserFullName,
        Age: profile.Age,
        Gender: profile.Gender,
        Location: profile.Location,
        Bio: profile.Bio,
        Interests: profile.Interests
      };
      
      const response = await fetch(EDIT_PROFILE_URI.replace("{id}", id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile), // Send the updated profile as the request body
      });

      if (response.ok) {
        setSuccessMessage('Profile updated successfully!'); // Show success message
        setTimeout(() => setSuccessMessage(''), 3000); // Hide success message after 3 seconds
        setIsEditing(false); // Switch back to view mode
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      setError(error.message); // Show error if update fails
    }
  };

  if (loading) {
    return <Loading />; // Show the loading spinner while fetching data
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="profile-details-container">
      <div className="profile-card">
        <h1>{profile.ProfileLabel} 👤</h1>
        <hr />
        <div className="profile-content">
          <div className="profile-text">
            {isEditing ? (
              <>
                <div className="input-group">
                  <label htmlFor="profileLabel">Profile Label</label>
                  <input
                    id="profileLabel"
                    type="text"
                    value={profile.ProfileLabel}
                    onChange={(e) => setProfile({ ...profile, ProfileLabel: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={profile.UserFullName}
                    onChange={(e) => setProfile({ ...profile, UserFullName: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="userName">Username</label>
                  <input
                    id="userName"
                    type="text"
                    value={profile.UserName}
                    onChange={(e) => setProfile({ ...profile, UserName: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="age">Age</label>
                  <input
                    id="age"
                    type="number"
                    value={profile.Age}
                    onChange={(e) => setProfile({ ...profile, Age: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="gender">Gender</label>
                  <input
                    id="gender"
                    type="text"
                    value={profile.Gender}
                    onChange={(e) => setProfile({ ...profile, Gender: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    type="text"
                    value={profile.Location}
                    onChange={(e) => setProfile({ ...profile, Location: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    value={profile.Bio}
                    onChange={(e) => setProfile({ ...profile, Bio: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="interests">Interests</label>
                  <textarea
                    id="interests"
                    value={profile.Interests}
                    onChange={(e) => setProfile({ ...profile, Interests: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <p><strong>Profile Label:</strong> {profile.ProfileLabel}</p>
                <p><strong>Full Name:</strong> {profile.UserFullName}</p>
                <p><strong>Username:</strong> {profile.UserName}</p>
                <p><strong>Age:</strong> {profile.Age} 🎂</p>
                <p><strong>Gender:</strong> {profile.Gender} ⚧</p>
                <p><strong>Location:</strong> {profile.Location} 📍</p>
                <p><strong>Bio:</strong> {profile.Bio}</p>
                <p><strong>Interests:</strong> {profile.Interests} 🌟</p>
              </>
            )}
          </div>

          <div className="profile-image-container">
            {imageUrl && <img src={imageUrl} alt={profile.UserName} className="profile-image" />}
          </div>
        </div>
        <hr />

        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="button-group">
          <button onClick={handleDeleteProfile} className="delete-profile-btn">
            Delete Profile 🗑️
          </button>

          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="edit-profile-btn">
              Edit Profile ✏️
            </button>
          ) : (
            <button onClick={handleUpdateProfile} className="update-profile-btn">
              Update Profile 💾
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
