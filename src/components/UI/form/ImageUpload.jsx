import { FaCloudUploadAlt } from "react-icons/fa";
import { message } from "antd";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const ImageUpload = ({ setSelectedImage, setFile }) => {
  const handleFileChange = (event) => {
    const files = event.target.files;

    if (files && files.length > 0) {
      const file = files[0];

      if (!ALLOWED_EXTENSIONS.includes(file.type.toLowerCase())) {
        message.error('Please select a valid JPG, JPEG, PNG, or WEBP image file.');
        event.target.value = '';
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        message.error('Image must be 5MB or smaller.');
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      setFile(file);
      reader.onload = () => {
        setSelectedImage(reader.result);
        message.success('Image selected. Click Save Changes to update your profile.');
      };
      reader.onerror = () => {
        setFile(null);
        setSelectedImage(null);
        message.error('Unable to preview this image. Please try another file.');
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <>
      <div className="change-photo-btn">
        <span className="d-flex align-items-center justify-content-center gap-2">
          <FaCloudUploadAlt className="icon" style={{ fontSize: '1.6rem' }} /> Upload Photo
        </span>
        <input 
          type="file" 
          className="upload" 
          accept="image/png, image/jpeg, image/jpg, image/webp" 
          onChange={handleFileChange} 
          aria-label="Upload profile image" 
        />
      </div>
      <div>
        <small className="form-text text-muted">Supports JPG, JPEG, PNG, WEBP (max 5 MB).</small>
      </div>
    </>
  );
};
export default ImageUpload;