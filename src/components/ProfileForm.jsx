import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Use useNavigate instead of useHistory
import './ProfileForm.css'; // Import the necessary CSS file
import { FaFileUpload } from 'react-icons/fa'; // Import file upload icon
import Placeholder from '../assets/placeholder.jpeg'; // Placeholder image
import Loading from './Loading'; // Import the Loading component

const ProfileForm = () => {
  // Initialize state for the form fields
  const [profileID, setProfileID] = useState(1);
  const [profileLabel, setProfileLabel] = useState('');
  const [userName, setUserName] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [age, setAge] = useState();
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [file, setFile] = useState(null);  // State for storing the selected profile picture
  const [showPopup, setShowPopup] = useState(false); // State to manage popup visibility
  const [loading, setLoading] = useState(false); // Loading state for spinner

  const CIA_URI = "https://prod-30.northcentralus.logic.azure.com:443/workflows/46610aab1a504ee691e20161e977e170/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=FkjsIANUjQ1e2ry6p6hV-xUuimPJEf-VFheTUqF7G_A";
  const IUPS_URI = "https://prod-93.westus.logic.azure.com:443/workflows/7bc160bcbed34a37a39559ae192105b3/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=Y3MWnowlPVykd9DKDVX1s3WM1D4yFLyeGnm_SfNyUYc";  

  const navigate = useNavigate(); // Use useNavigate to handle navigation

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Show the loading spinner
    setLoading(true);

    // Ensure the file is selected
    if (!file) {
      alert('Please select an image to upload');
      setLoading(false); // Hide spinner if file is not selected
      return;
    }

    try {
      // Prepare the form data to send to the IUPS endpoint
      const formData = new FormData();

      // Add user data to the FormData
      formData.append('userID', profileID);
      formData.append('userName', userName);
      formData.append('FileName', file.name);
      formData.append('File', file); // Add the selected file (profile picture)

      // Send the request to the IUPS endpoint
      const response = await fetch(IUPS_URI, {
        method: 'POST',
        body: formData, // Send the FormData containing the file and metadata
      });

      if (response.ok) {
        console.log('Profile picture uploaded successfully');
        // Optionally, you can handle success here, like updating the UI or user profile
      } else {
        console.error('Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    }

    // Now, send the profile data to your backend (e.g., CIA_URI)
    const profileObj = {
      ProfileID: profileID,
      ProfileLabel: profileLabel,
      UserName: userName,
      UserFullName: userFullName,
      Age: age,
      Gender: gender,
      Location: location,
      Bio: bio,
      Interests: interests
    };

    try {
      const response = await fetch(CIA_URI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileObj),
      });

      if (response.ok) {
        console.log('Profile created successfully');
        
        // Show the success popup
        setShowPopup(true);

        // Clear the form
        setProfileLabel('');
        setUserName('');
        setUserFullName('');
        setAge('');
        setGender('');
        setLocation('');
        setBio('');
        setInterests('');
        setFile(null);

        // Hide the loading spinner
        setLoading(false);

        // Redirect to the homepage after a successful profile creation
        setTimeout(() => {
          navigate('/'); // Navigate back to the homepage using useNavigate
        }, 2000); // Redirect after 2 seconds
      } else {
        console.error('Failed to create profile');
        setLoading(false); // Hide spinner in case of failure
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      setLoading(false); // Hide spinner in case of failure
    }
  };

  return (
    <div className="profile-form-container">
      {loading && <Loading />} {/* Show loading spinner if loading is true */}
      {showPopup && (
        <div className="success-popup">
          <h2>Profile Created Successfully!</h2>
          </div>
      )}
      <form
        className="profile-form"
        onSubmit={handleSubmit} // Use handleSubmit for form submission
      >
        <h2>Create User Profile</h2>

        {/* Profile Label */}
        <div className="form-group">
          <label>Profile Label</label>
          <input
            type="text"
            value={profileLabel}
            onChange={(e) => setProfileLabel(e.target.value)}
          />
        </div>

        {/* User Name */}
        <div className="form-group">
          <label>User Name</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>

        {/* Full Name */}
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={userFullName}
            onChange={(e) => setUserFullName(e.target.value)}
          />
        </div>

        {/* Age */}
        <div className="form-group">
          <label>Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        {/* Gender */}
        <div className="form-group">
          <label>Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Location */}
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Bio */}
        <div className="form-group">
          <label>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {/* Interests */}
        <div className="form-group">
          <label>Interests</label>
          <input
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
        </div>

        {/* File Input for Profile Picture */}
        <div className="form-group">
          <label>Profile Picture</label>
          <p>This will be displayed in the user gallery...</p>
          <br></br>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        {/* Image Preview */}
        <div className="upload-form_display">
          {
            file ? <img className="displayImg" src={URL.createObjectURL(file)} alt="no pic" />
              : <img className="displayImg" src={Placeholder} alt="nopic" />
          }
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn">Submit Profile</button>
      </form>
    </div>
  );
};

export default ProfileForm;
