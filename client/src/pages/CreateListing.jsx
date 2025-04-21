import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: '',
    description: '',
    address: '',
    type: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
    mapUrl: '', // Added mapUrl to match schema
  });
  const [mediaUploadError, setMediaUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMediaSubmit = (e) => {
    if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setMediaUploadError(false);
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(storeMedia(files[i], i));
      }
      Promise.all(promises)
        .then((urls) => {
          setFormData({
            ...formData,
            imageUrls: formData.imageUrls.concat(urls),
          });
          setMediaUploadError(false);
          setUploading(false);
          setUploadProgress({});
        })
        .catch((err) => {
          setMediaUploadError('Media upload failed (2 MB max for images, 100 MB max for videos)');
          setUploading(false);
          setUploadProgress({});
        });
    } else {
      setMediaUploadError('You can only upload 6 media files per listing');
      setUploading(false);
    }
  };

  const storeMedia = async (file, index) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'sahadEstate');
      formData.append('cloud_name', 'dqayn0zvu');

      const isVideo = file.type.startsWith('video/');
      const resourceType = isVideo ? 'video' : 'image';

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/dqayn0zvu/${resourceType}/upload`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress((prev) => ({ ...prev, [index]: progress }));
        }
      };

      xhr.onload = () => {
        const data = JSON.parse(xhr.responseText);
        console.log('Cloudinary response:', data);
        if (data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed'));
      };

      xhr.send(formData);
    });
  };

  const handleRemoveMedia = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

  const handleChange = (e) => {
    if (e.target.id === 'sale' || e.target.id === 'rent') {
      setFormData({
        ...formData,
        type: e.target.id,
      });
    } else if (
      e.target.id === 'parking' ||
      e.target.id === 'furnished' ||
      e.target.id === 'offer'
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.checked,
      });
    } else if (
      e.target.type === 'number' ||
      e.target.type === 'text' ||
      e.target.type === 'textarea'
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit started, formData:', formData);
    try {
      // Validate required fields
      if (formData.imageUrls.length < 1) {
        console.log('Validation failed: No media files');
        setError('You must upload at least one media file');
        return;
      }
      if (formData.offer && +formData.regularPrice < +formData.discountPrice) {
        console.log('Validation failed: Discount price issue');
        setError('Discount price must be lower than regular price');
        return;
      }
      if (!formData.name || !formData.description || !formData.address) {
        console.log('Validation failed: Missing required text fields');
        setError('Please fill in all required fields (name, description, address)');
        return;
      }

      setLoading(true);
      setError(false);
      console.log('Sending request to /api/listing/create with data:', {
        ...formData,
        userRef: currentUser._id,
      });
      const res = await fetch('/api/listing/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
      });
      console.log('Response received:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      setLoading(false);
      if (data.success === false) {
        console.log('Backend error:', data.message);
        setError(data.message);
        return;
      }
      console.log('Navigating to /listing/', data._id);
      navigate(`/listing/${data._id}`);
    } catch (error) {
      console.error('handleSubmit error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <main className='p-3 max-w-4xl mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>
        Create a Listing
      </h1>
      {loading && <p className='text-center my-7 text-2xl'>Creating listing...</p>}
      {error && <p className='text-center my-7 text-2xl text-red-700'>{error}</p>}
      <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-4'>
        <div className='flex flex-col gap-4 flex-1'>
          <input
            type='text'
            placeholder='Name'
            className='border p-3 rounded-lg'
            id='name'
            maxLength='62'
            minLength='10'
            required
            onChange={handleChange}
            value={formData.name}
          />
          <textarea
            placeholder='Description'
            className='border p-3 rounded-lg'
            id='description'
            required
            onChange={handleChange}
            value={formData.description}
          />
          <div className='flex flex-col gap-2'>
            <input
              type='text'
              placeholder='Address'
              className='border p-3 rounded-lg'
              id='address'
              required
              onChange={handleChange}
              value={formData.address}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <input
              type='text'
              placeholder='Google Maps Embed URL (e.g., iframe src)'
              className='border p-3 rounded-lg'
              id='mapUrl'
              onChange={handleChange}
              value={formData.mapUrl}
            />
          </div>
          <div className='flex gap-6 flex-wrap'>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='sale'
                className='w-5'
                onChange={handleChange}
                checked={formData.type === 'sale'}
              />
              <span>Sell</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='rent'
                className='w-5'
                onChange={handleChange}
                checked={formData.type === 'rent'}
              />
              <span>Rent</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='parking'
                className='w-5'
                onChange={handleChange}
                checked={formData.parking}
              />
              <span>Parking spot</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='furnished'
                className='w-5'
                onChange={handleChange}
                checked={formData.furnished}
              />
              <span>Furnished</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='offer'
                className='w-5'
                onChange={handleChange}
                checked={formData.offer}
              />
              <span>Offer</span>
            </div>
          </div>
          <div className='flex flex-wrap gap-6'>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='bedrooms'
                min='1'
                max='10'
                required
                className='p-3 border border-gray-300 rounded-lg'
                onChange={handleChange}
                value={formData.bedrooms}
              />
              <p>Beds</p>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='bathrooms'
                min='1'
                max='10'
                required
                className='p-3 border border-gray-300 rounded-lg'
                onChange={handleChange}
                value={formData.bathrooms}
              />
              <p>Baths</p>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='regularPrice'
                min='50'
                max='10000000'
                required
                className='p-3 border border-gray-300 rounded-lg'
                onChange={handleChange}
                value={formData.regularPrice}
              />
              <div className='flex flex-col items-center'>
                <p>Regular price</p>
                {formData.type === 'rent' && (
                  <span className='text-xs'>(₹ / month)</span>
                )}
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='discountPrice'
                min='0'
                max='10000000'
                required
                className='p-3 border border-gray-300 rounded-lg'
                onChange={handleChange}
                value={formData.discountPrice}
              />
              <div className='flex flex-col items-center'>
                <p>Discounted price</p>
                {formData.type === 'rent' && (
                  <span className='text-xs'>(₹ / month)</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className='flex flex-col flex-1 gap-4'>
          <p className='font-semibold'>
            Media:
            <span className='font-normal text-gray-600 ml-2'>
              The first media will be the cover (max 6, images or videos)
            </span>
          </p>
          <div className='flex gap-4'>
            <input
              onChange={(e) => setFiles(e.target.files)}
              className='p-3 border border-gray-300 rounded w-full'
              type='file'
              id='media'
              accept='image/*,video/*'
              multiple
            />
            <button
              type='button'
              disabled={uploading}
              onClick={handleMediaSubmit}
              className='p-3 text-green-700 border border-green-700 rounded uppercase hover:shadow-lg disabled:opacity-80'
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          <p className='text-red-700 text-sm'>
            {mediaUploadError && mediaUploadError}
          </p>
          {formData.imageUrls.length > 0 &&
            formData.imageUrls.map((url, index) => (
              <div
                key={url}
                className='flex justify-between p-3 border items-center'
              >
                {url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) ? (
                  <video
                    src={url}
                    controls
                    className='w-20 h-20 object-contain rounded-lg'
                    onError={(e) => {
                      console.error(`Preview video failed to load: ${url}`, e);
                    }}
                  />
                ) : (
                  <img
                    src={url}
                    alt='listing media'
                    className='w-20 h-20 object-contain rounded-lg'
                  />
                )}
                <div className='flex flex-col items-end'>
                  {uploadProgress[index] && (
                    <span className='text-slate-700 text-xs'>
                      {`Uploading ${uploadProgress[index]}%`}
                    </span>
                  )}
                  <button
                    type='button'
                    onClick={() => handleRemoveMedia(index)}
                    className='p-3 text-red-700 rounded-lg uppercase hover:opacity-75'
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          <button
            disabled={loading || uploading}
            className='p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80'
          >
            {loading ? 'Creating...' : 'Create listing'}
          </button>
          {error && <p className='text-red-700 text-sm'>{error}</p>}
        </div>
      </form>
    </main>
  );
}