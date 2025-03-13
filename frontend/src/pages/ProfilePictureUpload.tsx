// ProfilePictureUpload.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const ProfilePictureUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [profile, setProfile] = useState(null);

  // Fetch current profile data
  useEffect(() => {
    axios.get("/api/me/")  // adjust the endpoint as needed
      .then(response => setProfile(response.data))
      .catch(err => console.error(err));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("profile_picture", selectedFile);

    try {
      const response = await axios.put("/profiles/me/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          // include auth token if needed
        },
      });
      setProfile(response.data);
      alert("Profile picture updated!");
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  return (
    <div>
      <h2>Update Profile Picture</h2>
      {profile && profile.profile_picture && (
        <img src={profile.profile_picture} alt="Profile" width="150" />
      )}
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        {preview && <img src={preview} alt="Preview" width="100" />}
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default ProfilePictureUpload;
