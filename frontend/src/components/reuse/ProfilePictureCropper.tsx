import React, { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cropper from "react-easy-crop";
import AxiosInstance from "@/components/axios/axios";
import getCroppedImg from "@/components/reuse/CropImage"; // see helper below

const ProfilePictureCropper: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  console.log("Crop page state:", location.state);
  const { imageUrl } = location.state as { imageUrl: string };

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      // getCroppedImg returns a Blob object representing the cropped image.
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
      // Prepare form data for upload.
      const formData = new FormData();
      formData.append("profile_picture", croppedBlob, "cropped.jpg");

      // Upload cropped image.
      const response = await AxiosInstance.patch("/profiles/me/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // Optionally, you can update state in a parent or navigate back.
      navigate(-1); // go back to previous page
    } catch (error) {
      console.error("Error cropping and saving image:", error);
    }
  };

  return (
    <div className="relative h-screen w-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="relative w-80 h-80 bg-black">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded">
          Save
        </button>
        <button onClick={() => navigate(-1)} className="bg-gray-500 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ProfilePictureCropper;
