import React, { useState, useEffect } from 'react';
import { AiFillDelete } from 'react-icons/ai';  // Import the delete icon
import { BlobServiceClient } from '@azure/storage-blob';
import './ImageGallery.css'; // Import your custom CSS styles

const ImageGallery = () => {
  const [imageUrls, setImageUrls] = useState([]); // State to store image URLs
  const [imageNames, setImageNames] = useState([]); // State to store image names (for deletion)
  const [error, setError] = useState(null); // Error state for handling issues
  const [loading, setLoading] = useState(true); // Loading state

  // Azure Blob Storage credentials
  const account = import.meta.env.VITE_STORAGE_ACCOUNT;
  const sasToken = import.meta.env.VITE_STORAGE_SAS;
  const containerName = import.meta.env.VITE_STORAGE_CONTAINER;
  const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net/?${sasToken}`);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Fetch images and their names from Blob Storage
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const blobItems = containerClient.listBlobsFlat(); // List all blobs in the container
        const urls = [];
        const names = [];
        for await (const blob of blobItems) {
          const blobUrl = `https://${account}.blob.core.windows.net/${containerName}/${blob.name}`;
          urls.push(blobUrl); // Push the URL to the image URL array
          names.push(blob.name); // Push the image name to the names array
        }
        setImageUrls(urls); // Update state with the image URLs
        setImageNames(names); // Update state with the image names
        setLoading(false); // Set loading to false when done
      } catch (err) {
        setError(err.message); // Handle any errors
        setLoading(false);
      }
    };

    fetchImages(); // Call the fetch function on component mount
  }, [account, containerName, sasToken]);

  // Handle delete operation
  const handleDelete = async (imageName) => {
    if (!account || !sasToken || !containerName) {
      alert('Please make sure you have set the Azure Storage credentials in the .env file');
      return;
    }

    try {
      setLoading(true); // Turn on loading
      const blobClient = containerClient.getBlockBlobClient(imageName); // Get the blob client
      await blobClient.delete(); // Delete the blob

      // After deleting, remove the image from the UI
      setImageUrls(imageUrls.filter((url) => !url.includes(imageName))); // Remove URL
      setImageNames(imageNames.filter((name) => name !== imageName)); // Remove name
    } catch (error) {
      console.log(error); // Handle error
    } finally {
      setLoading(false); // Turn off loading
    }
  };

  if (loading) {
    return <div>Loading images...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="image-gallery">
      {imageUrls.length === 0 ? (
        <p>No images found.</p>
      ) : (
        imageUrls.map((url, index) => (
          <div key={index} className="image-item">
            <img src={url} alt={`Blob image ${index}`} className="image" />
            <div className="delete-container">
              <button
                className="delete-btn"
                onClick={() => handleDelete(imageNames[index])} // Delete image on button click
              >
                <AiFillDelete /> Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ImageGallery;
