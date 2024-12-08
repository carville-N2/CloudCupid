import React, { useState, useEffect } from 'react';
import './HomePage.css';
import { Link } from 'react-router-dom';
import Loading from './Loading'; // Import the Loading component

const Homepage = () => {
  const [profiles, setProfiles] = useState([]); // State for profiles
  const [error, setError] = useState(null); // Error state
  const [loading, setLoading] = useState(true); // Loading state to manage loading spinner

  // The API URI for fetching all profiles
  const RAA_URI = "https://prod-19.northcentralus.logic.azure.com/workflows/953a5940549643c7b72fac4e6d8958c5/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/profiles?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=mIKf7Dwx2wBZxq2v44LW-NzhyRcHmr-KrYKSmwo_UmU";

  // Function to fetch profiles
  const fetchProfiles = async () => {
    try {
      const response = await fetch(RAA_URI);
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }
      const data = await response.json();
      localStorage.setItem('profiles', JSON.stringify(data)); // Store profiles in localStorage
      setProfiles(data); // Update the profiles state
      setLoading(false); // Set loading to false after data is fetched
    } catch (err) {
      setError(err.message);
      setLoading(false); // Set loading to false even if there's an error
    }
  };

  useEffect(() => {
    // Fetch profiles when the component mounts
    fetchProfiles();

    // Set an interval to fetch profiles every 30 seconds (adjust as needed)
    const intervalId = setInterval(() => {
      fetchProfiles();
    }, 30000); // Refresh every 30 seconds

    // Cleanup the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array to run once when the component mounts

  if (loading) {
    return <Loading />; // Show the Loading component while data is being fetched
  }

  return (
    <div>
      <div className="title">
        <br />
        <h1>Welcome to Cloud Cupid</h1>
        <h2>A serverless dating application</h2>
        <p>Here are some profiles:</p>
        <br />
      </div>
      <div className="profiles-list">
        {profiles.length === 0 ? (
          <p>No profiles found.</p>
        ) : (
          profiles.map((profile) => {
            return (
              <div key={profile.ProfileID} className="profile-card">
                <h2>
                  <Link to={`/profile/${profile.ProfileID}`}>{profile.ProfileLabel}</Link> 
                </h2>
                <div className="profile-tiles">
                  <div className="tile">
                    <strong>Gender:</strong> {profile.Gender}
                  </div>
                  <div className="tile">
                    <strong>Location:</strong> {profile.Location}
                  </div>
                  <div className="tile">
                    <strong>Bio:</strong> {profile.Bio}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Homepage;
