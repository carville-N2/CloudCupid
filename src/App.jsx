import { useEffect, useState } from 'react';
import './App.css';
import { AiFillDelete } from 'react-icons/ai';  // import the delete icon
import { FaFileUpload } from 'react-icons/fa';  // import the file upload icon
import Placeholder from './assets/placeholder.jpeg';  // import the placeholder image
import Loading from './components/Loading';  // import the loading component
import { BlobServiceClient } from '@azure/storage-blob';
import ProfileForm from './components/ProfileForm';
import Homepage from './components/HomePage';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';  // Import necessary components
import UserProfile from './components/UserProfile';
import ImageGallery from './components/ImageGallery';


const App = () => {
  const [file, setFile] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Storage account credentials
  const account = import.meta.env.VITE_STORAGE_ACCOUNT;  // get the storage account name from the .env file
  const sasToken = import.meta.env.VITE_STORAGE_SAS;  // get the SAS token from the .env file
  const containerName = import.meta.env.VITE_STORAGE_CONTAINER;  // get the container name from the .env file
  const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net/?${sasToken}`);  // create a blobServiceClient
  const containerClient = blobServiceClient.getContainerClient(containerName);  // create a containerClient

  const RAA_URI = "https://prod-19.northcentralus.logic.azure.com/workflows/953a5940549643c7b72fac4e6d8958c5/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/profiles?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=mIKf7Dwx2wBZxq2v44LW-NzhyRcHmr-KrYKSmwo_UmU";
  
  // Fetch all profiles
  const fetchProfiles = async () => {
    try {
      const response = await fetch(RAA_URI);
      if (!response.ok) {
        throw new Error('Failed to fetch user profiles');
      }
      const data = await response.json();
      setProfiles(data); // Update profiles state
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch all images from Blob Storage
  const fetchImages = async () => {
    if (!account || !sasToken || !containerName) {  // check if the credentials are set
      alert('Please make sure you have set the Azure Storage credentials in the .env file');
      return;
    }
    try {
      setLoading(true); // Turn on loading
      const blobItems = containerClient.listBlobsFlat();  // get all blobs in the container     
      const urls = [];
      for await (const blob of blobItems) {
        const tempBlockBlobClient = containerClient.getBlockBlobClient(blob.name);  // get the blob client
        urls.push({ name: blob.name, url: tempBlockBlobClient.url });  // push the image name and url to the urls array
      }
      setImageUrls(urls);  // set the urls array to the imageUrls state
    } catch (error) {
      console.error(error);  // Handle error
    } finally {
      setLoading(false);  // Turn off loading
    }
  };

  // Generate random pairings of profiles and images
  const generateRandomPairings = () => {
    if (profiles.length === 0 || imageUrls.length === 0) return;

    const pairings = [];
    const availableImages = [...imageUrls]; // Copy image URLs array
    profiles.forEach(profile => {
      if (availableImages.length === 0) return; // Stop if no images are left
      const randomIndex = Math.floor(Math.random() * availableImages.length);
      const randomImage = availableImages.splice(randomIndex, 1)[0]; // Get a random image and remove it from the list
      pairings.push({ ...profile, imageUrl: randomImage.url, username: randomImage.name });
    });

    // Store pairings in session storage to ensure consistency during the session
    sessionStorage.setItem('imageProfilePairings', JSON.stringify(pairings));
  };

  // Load random pairings from session storage
  const loadPairings = () => {
    const savedPairings = sessionStorage.getItem('imageProfilePairings');
    if (savedPairings) {
      return JSON.parse(savedPairings);
    }
    return [];
  };

  // Handle image upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {  // check if the file is selected
      alert('Please select an image to upload');
      return;
    }
    if (!account || !sasToken || !containerName) {  // check if the credentials are set
      alert('Please make sure you have set the Azure Storage credentials in the .env file');
      return;
    }
    try {
      setLoading(true);
      const blobName = `${new Date().getTime()}-${file.name}`; // Specify a default blob name
      const blobClient = containerClient.getBlockBlobClient(blobName);  // get the blob client
      await blobClient.uploadData(file, { blobHTTPHeaders: { blobContentType: file.type } }); // upload the image
      await fetchImages();   // fetch all images again after the upload is completed
    } catch (error) {
      console.error(error);  // Handle error
    } finally {
      setLoading(false); // Turn off loading
    }
  };

  // Handle image deletion
  const handleDelete = async (blobName) => {
    if (!account || !sasToken || !containerName) {  // check if the credentials are set
      alert('Please make sure you have set the Azure Storage credentials in the .env file'); return;
    }
    try {
      setLoading(true);  // Turn on loading
      const blobClient = containerClient.getBlockBlobClient(blobName); // get the blob client
      await blobClient.delete(); // delete the blob
      fetchImages(); // fetch all images again after the delete is completed
    } catch (error) {
      console.log(error); // Handle error
    } finally {
      setLoading(false);  //
    }
  };

  // Fetch images and profiles when the page loads
  useEffect(() => {
    fetchImages();
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (profiles.length > 0 && imageUrls.length > 0) {
      generateRandomPairings(); // Generate random pairings when both profiles and images are available
    }
  }, [profiles, imageUrls]);

  return (
    <Router>
      <div className="container">
      <Navbar /> {/* Render Navbar */}
        
      {loading && <Loading />}
      <Routes>
          <Route path="/" element={<Homepage />} />  {/* Homepage route */}
          <Route path="/profile" element={<ProfileForm />} />  {/* Profile form route */}
          <Route path="/gallery" element={<ImageGallery />} />  {/* Profile form route */}
          <Route path="/profile/:id" element={<UserProfile />} />  {/* User Profile route */}
      </Routes>

        
      </div>
      
    </Router>
  );
}

export default App;
