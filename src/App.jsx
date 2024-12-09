import { useEffect, useState } from 'react';
import './App.css';
import { AiFillDelete } from 'react-icons/ai';
import { FaFileUpload } from 'react-icons/fa';
import Placeholder from './assets/placeholder.jpeg';
import Loading from './components/Loading';
import { BlobServiceClient } from '@azure/storage-blob';
import ProfileForm from './components/ProfileForm';
import Homepage from './components/HomePage';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserProfile from './components/UserProfile';
import ImageGallery from './components/ImageGallery';
import { appInsights } from './appInsights';  // Import Application Insights

const App = () => {
  const [file, setFile] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const account = import.meta.env.VITE_STORAGE_ACCOUNT;
  const sasToken = import.meta.env.VITE_STORAGE_SAS;
  const containerName = import.meta.env.VITE_STORAGE_CONTAINER;
  const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net/?${sasToken}`);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const RAA_URI = "https://prod-19.northcentralus.logic.azure.com/workflows/953a5940549643c7b72fac4e6d8958c5/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/profiles?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=mIKf7Dwx2wBZxq2v44LW-NzhyRcHmr-KrYKSmwo_UmU";

  const fetchProfiles = async () => {
    try {
      const response = await fetch(RAA_URI);
      if (!response.ok) {
        throw new Error('Failed to fetch user profiles');
      }
      const data = await response.json();
      setProfiles(data);
      appInsights.trackEvent({ name: 'Fetched Profiles' });  // Track event in Application Insights
    } catch (error) {
      console.error(error);
      appInsights.trackException({ error });  // Track exception in Application Insights
    }
  };

  const fetchImages = async () => {
    if (!account || !sasToken || !containerName) {
      alert('Please make sure you have set the Azure Storage credentials in the .env file');
      return;
    }
    try {
      setLoading(true);
      const blobItems = containerClient.listBlobsFlat();
      const urls = [];
      for await (const blob of blobItems) {
        const tempBlockBlobClient = containerClient.getBlockBlobClient(blob.name);
        urls.push({ name: blob.name, url: tempBlockBlobClient.url });
      }
      setImageUrls(urls);
      appInsights.trackEvent({ name: 'Fetched Images' });  // Track event in Application Insights
      setLoading(false);
    } catch (error) {
      console.error(error);
      appInsights.trackException({ error });
      setLoading(false);
    }
  };

  const generateRandomPairings = () => {
    if (profiles.length === 0 || imageUrls.length === 0) return;

    const pairings = [];
    const availableImages = [...imageUrls];
    profiles.forEach(profile => {
      if (availableImages.length === 0) return;
      const randomIndex = Math.floor(Math.random() * availableImages.length);
      const randomImage = availableImages.splice(randomIndex, 1)[0];
      pairings.push({ ...profile, imageUrl: randomImage.url, username: randomImage.name });
    });

    sessionStorage.setItem('imageProfilePairings', JSON.stringify(pairings));
  };

  const loadPairings = () => {
    const savedPairings = sessionStorage.getItem('imageProfilePairings');
    if (savedPairings) {
      return JSON.parse(savedPairings);
    }
    return [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select an image to upload');
      return;
    }
    if (!account || !sasToken || !containerName) {
      alert('Please make sure you have set the Azure Storage credentials in the .env file');
      return;
    }
    try {
      setLoading(true);
      const blobName = `${new Date().getTime()}-${file.name}`;
      const blobClient = containerClient.getBlockBlobClient(blobName);
      await blobClient.uploadData(file, { blobHTTPHeaders: { blobContentType: file.type } });
      await fetchImages();
      appInsights.trackEvent({ name: 'Image Uploaded' });  // Track image upload event
    } catch (error) {
      console.error(error);
      appInsights.trackException({ error });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blobName) => {
    if (!account || !sasToken || !containerName) {
      alert('Please make sure you have set the Azure Storage credentials in the .env file');
      return;
    }
    try {
      setLoading(true);
      const blobClient = containerClient.getBlockBlobClient(blobName);
      await blobClient.delete();
      fetchImages();
      appInsights.trackEvent({ name: 'Image Deleted' });  // Track image deletion event
    } catch (error) {
      console.log(error);
      appInsights.trackException({ error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (profiles.length > 0 && imageUrls.length > 0) {
      generateRandomPairings();
    }
  }, [profiles, imageUrls]);

  return (
    <Router>
      <div className="container">
        <Navbar />
        {loading && <Loading />}
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/profile" element={<ProfileForm />} />
          <Route path="/gallery" element={<ImageGallery />} />
          <Route path="/profile/:id" element={<UserProfile />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
