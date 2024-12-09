import React, { useState, useEffect } from 'react';
import { AiFillDelete } from 'react-icons/ai';  // Import the delete icon
import { BlobServiceClient } from '@azure/storage-blob';
import './ImageGallery.css'; // Import your custom CSS styles

const ImageGallery = () => {
  const [imageUrls, setImageUrls] = useState([]); // State to store image URLs
  const [imageMetadata, setImageMetadata] = useState([]); // State to store image metadata
  const [error, setError] = useState(null); // Error state for handling issues
  const [loading, setLoading] = useState(true); // Loading state

  // Azure Blob Storage credentials
  const account = import.meta.env.VITE_STORAGE_ACCOUNT;
  const sasToken = import.meta.env.VITE_STORAGE_SAS;
  const containerName = import.meta.env.VITE_STORAGE_CONTAINER;
  const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net/?${sasToken}`);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Fetch metadata from Cosmos DB (you can replace this with your actual endpoint)
  const fetchMetadata = async () => {
    try {
      const response = await fetch('https://prod-14.northcentralus.logic.azure.com:443/workflows/518f01fbd886457783c078752a3e7094/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=9hAQOvj22xTOAPdiQDpedw_LLPPVB8ICvWZn-F-4Ius'); // Replace with your actual API URL
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        const metadata = await response.json();
        setImageMetadata(metadata); // Set the metadata to state
      } else {
        const text = await response.text();
        throw new Error(`Expected JSON, but got: ${text}`);
      }
    } catch (err) {
      setError(`Error fetching metadata: ${err.message}`);
      setLoading(false);
    }
  };

  // Fetch images from Azure Blob Storage
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const blobItems = containerClient.listBlobsFlat(); // List all blobs in the container
        const urls = [];
        for await (const blob of blobItems) {
          const blobUrl = `https://${account}.blob.core.windows.net/${containerName}/${blob.name}`;
          urls.push(blobUrl); // Push the URL to the image URL array
        }
        setImageUrls(urls); // Update state with the image URLs
        setLoading(false); // Set loading to false when done
      } catch (err) {
        setError(err.message); // Handle any errors
        setLoading(false);
      }
    };

    fetchImages(); // Fetch images
    fetchMetadata(); // Fetch metadata
  }, [account, containerName, sasToken]);

  // Map metadata to images by matching the numeric part of the filePath and image name
  const mapMetadataToImages = (imageUrls, imageMetadata) => {
    return imageUrls.map((url) => {
      const imageName = url.split('/').pop(); // Get the image file name from URL
      const numericImageName = imageName.split('-')[0]; // Assuming the numeric part is before the dash

      // Find the metadata by extracting the numeric part of the filePath
      const metadata = imageMetadata.find((item) => {
        const filePathId = item.filePath.split('/').pop(); // Extract the numeric ID from the filePath
        return filePathId === numericImageName;  // Match the numeric ID in filePath with the image name
      });

      return { url, metadata };
    });
  };

  // Handle delete operation
  const handleDelete = async (filePath) => {
    if (!account || !sasToken || !containerName) {
      alert('Please make sure you have set the Azure Storage credentials in the .env file');
      return;
    }

    try {
      setLoading(true); // Turn on loading

      // Extract numeric ID from the filePath to delete the correct blob
      const numericId = filePath.split('/').pop(); // Extract the numeric ID from the filePath
      console.log('Deleting blob with numeric ID:', numericId); // Log to verify

      const blobClient = containerClient.getBlockBlobClient(numericId); // Get the blob client using the numeric ID
      await blobClient.delete(); // Delete the blob

      // After deleting, remove the image from the UI
      setImageUrls(imageUrls.filter((url) => !url.includes(numericId))); // Remove URL
      setImageMetadata(imageMetadata.filter((metadata) => metadata.filePath !== filePath)); // Remove metadata
    } catch (error) {
      console.log('Error deleting image from Blob Storage:', error); // Handle error
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

  // Combine metadata and image URLs
  const mappedImages = mapMetadataToImages(imageUrls, imageMetadata);

  return (
    <div className="image-gallery">
      {mappedImages.length === 0 ? (
        <p>No images found.</p>
      ) : (
        mappedImages.map(({ url, metadata }, index) => (
          <div key={index} className="image-item">
            <img src={url} alt={`Blob image ${index}`} className="image" />
            {/* Text and delete button inside the same container */}
            <div className="image-info">
              <p><strong>Name:</strong> {metadata?.fileName}</p>
              <p><strong>Uploaded by:</strong> {metadata?.userName}</p>
              <div className="delete-container">
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(metadata?.filePath)} // Use the filePath for delete
                >
                  <AiFillDelete /> Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ImageGallery;
