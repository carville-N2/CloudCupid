import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loading from './Loading'; // Import the Loading component
import './UserProfile.css'; // Import the UserProfile CSS file
import { BlobServiceClient } from '@azure/storage-blob'; // Import the BlobServiceClient for Azure Blob Storage
import { AiFillDelete } from 'react-icons/ai';  // Import the delete icon

const RIA_URI = "https://prod-14.northcentralus.logic.azure.com/workflows/f39f317737ea435681f5da04bde43476/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/profiles/{id}?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=-K-x0oN-krttKOovd8JTMHQ908pWZSUWkmfYk0dODmA";
const DELETE_PROFILE_URI = "https://prod-21.northcentralus.logic.azure.com/workflows/687188a6f9854b76b1b0fe43c300a49d/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/profiles/{id}?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=unXgxhoOZ3A61NrvWLrMOjsAD8zwv7_XsRdVSO7O3os"; 
const EDIT_PROFILE_URI = "https://prod-20.northcentralus.logic.azure.com/workflows/a7fa383d57fa4315b707a93641c68fc2/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/profiles/{id}?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=Xqp6LODbVUMpaX2UUSk-u01UZrOVa08fCe-OUao4zgo"; 

const UserProfilePage = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [imageUrls, setImageUrls] = useState([]); // State for image URLs
  const [imageMetadata, setImageMetadata] = useState([]); // State for image metadata
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Azure Blob Storage credentials
  const account = import.meta.env.VITE_STORAGE_ACCOUNT;
  const sasToken = import.meta.env.VITE_STORAGE_SAS;
  const containerName = import.meta.env.VITE_STORAGE_CONTAINER;
  const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net/?${sasToken}`);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Fetch profile data and image metadata
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(RIA_URI.replace("{id}", id));
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setProfile(data);
        setLoading(false);

        // Fetch image metadata
        fetchImageMetadata(data.UserName);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  // Fetch image metadata from the database (Cosmos DB or other)
  const fetchImageMetadata = async (userName) => {
    try {
      const response = await fetch('https://prod-14.northcentralus.logic.azure.com:443/workflows/518f01fbd886457783c078752a3e7094/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=9hAQOvj22xTOAPdiQDpedw_LLPPVB8ICvWZn-F-4Ius'); // Your API for fetching image metadata
      const data = await response.json();
      setImageMetadata(data);
      mapMetadataToImages(data, userName);
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  // Map metadata to images by matching the userName with the profile userName
  const mapMetadataToImages = (metadata, userName) => {
    const filteredImages = metadata.filter(item => item.userName === userName); // Filter images matching the userName
    const mappedImages = filteredImages.map(item => {
      const imageUrl = `https://${account}.blob.core.windows.net/${containerName}/${item.filePath.split('/').pop()}`;
      return { imageUrl, metadata: item };
    });
    setImageUrls(mappedImages);
  };

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
        navigate('/'); 
      } else {
        throw new Error('Failed to delete profile');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      const updatedProfile = {
        ProfileID: profile.ProfileID,
        ProfileLabel: profile.ProfileLabel,
        UserName: profile.UserName, // Do not allow UserName change
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
        body: JSON.stringify(updatedProfile),
      });

      if (response.ok) {
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        setIsEditing(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return <Loading />;
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
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={profile.UserFullName}
                    onChange={(e) => setProfile({ ...profile, UserFullName: e.target.value })}
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
            {imageUrls.length > 0 && imageUrls.map((image, index) => (
              <img key={index} src={image.imageUrl} alt={profile.UserName} className="profile-image" />
            ))}
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
