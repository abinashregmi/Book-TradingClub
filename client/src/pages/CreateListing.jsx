import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const params = useParams();
  const isEditMode = Boolean(params.listingId);

  const inputStyle =
    'border p-3 rounded-lg bg-white border-gray-300 w-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: '',
    description: '',
    address: '',
    type: 'sale',
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 1000,
    discountPrice: 500,
    parking: false,
    furnished: false,
    offer: false,
    governmentRegistrationNum: '', // Nepali Land Registry Number
  });
  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      if (!isEditMode) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/listing/get/${params.listingId}`);
        const data = await res.json();

        if (data.success === false) {
          setError(data.message || 'Failed to load listing');
          setLoading(false);
          return;
        }

        setFormData({
          imageUrls: data.imageUrls || [],
          name: data.name || '',
          description: data.description || '',
          address: data.address || '',
          type: data.type || 'sale',
          bedrooms: data.bedrooms ?? 1,
          bathrooms: data.bathrooms ?? 1,
          regularPrice: data.regularPrice ?? 1000,
          discountPrice: data.discountPrice ?? 500,
          parking: Boolean(data.parking),
          furnished: Boolean(data.furnished),
          offer: Boolean(data.offer),
          governmentRegistrationNum: data.governmentRegistrationNum || '',
        });
        setError(false);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [isEditMode, params.listingId]);

  // Cloudinary image upload handler with fallback parameters & debug logs
  const storeImageCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'faylt7ob';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

    console.log('[Cloudinary Upload] Initiating upload:', {
      fileName: file.name,
      fileSize: file.size,
      cloudName,
      uploadPreset,
    });

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', uploadPreset);
    uploadData.append('folder', 'samples/ecommerce');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: uploadData,
    });

    const data = await res.json();
    console.log('[Cloudinary Upload] Response from Cloudinary:', {
      status: res.status,
      ok: res.ok,
      data,
    });

    if (!res.ok || !data.secure_url) {
      const errorMsg = data.error?.message || `Upload failed with HTTP status ${res.status}`;
      console.error('[Cloudinary Upload Error]:', errorMsg);
      throw new Error(errorMsg);
    }

    return data.secure_url;
  };

  const handleImageSubmit = (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setImageUploadError('Please select at least one image file');
      return;
    }

    if (files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setImageUploadError(false);

      const promises = [];
      for (let i = 0; i < files.length; i++) {
        promises.push(storeImageCloudinary(files[i]));
      }

      Promise.all(promises)
        .then((urls) => {
          setFormData((prev) => ({
            ...prev,
            imageUrls: prev.imageUrls.concat(urls),
          }));
          setImageUploadError(false);
          setUploading(false);
          setFiles([]);
        })
        .catch((err) => {
          console.error('[Image Submit Failed]:', err);
          setImageUploadError(err.message || 'Image upload failed (Cloudinary configuration or 401 Unauthorized)');
          setUploading(false);
        });
    } else {
      setImageUploadError('You can only upload up to 6 images per listing');
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
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
      return;
    }

    if (
      e.target.id === 'parking' ||
      e.target.id === 'furnished' ||
      e.target.id === 'offer'
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.checked,
      });
      return;
    }

    if (
      e.target.type === 'number' ||
      e.target.type === 'text' ||
      e.target.type === 'textarea'
    ) {
      setFormData({
        ...formData,
        [e.target.id]: e.target.type === 'number' ? Number(e.target.value) : e.target.value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.imageUrls.length < 1) {
        return setError('You must upload at least one image');
      }
      if (!formData.governmentRegistrationNum.trim()) {
        return setError('Government Registration Number is required for CivicEstate listing');
      }
      if (+formData.regularPrice < +formData.discountPrice) {
        return setError('Discounted price must be lower than regular price');
      }
      if (!formData.type) {
        return setError('Please select Sell or Rent');
      }

      setLoading(true);
      setError(false);

      const res = await fetch(
        isEditMode
          ? `/api/listing/update/${params.listingId}`
          : '/api/listing/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            governmentRegistrationNum: formData.governmentRegistrationNum.trim().toUpperCase(),
            userRef: currentUser._id,
          }),
        }
      );

      const data = await res.json();
      setLoading(false);

      if (data.success === false) {
        setError(data.message);
        return;
      }

      navigate(`/listing/${data._id || params.listingId}`);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <main className='p-3 max-w-4xl mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>
        {isEditMode ? 'Update Listing' : 'Create a Listing'}
      </h1>
      <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-6'>
        {/* LEFT COLUMN */}
        <div className='flex flex-col gap-4 flex-1'>
          {/* REQUIRED GOVERNMENT REGISTRATION NUMBER FIELD */}
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-semibold uppercase text-slate-700'>
              Government Registration Number (Lalpurja Reference) *
            </label>
            <input
              type='text'
              placeholder='e.g., GOV-RE-XXXXX (e.g., GOV-RE-2081-09412)'
              className={inputStyle}
              id='governmentRegistrationNum'
              required
              onChange={handleChange}
              value={formData.governmentRegistrationNum}
            />
            <span className='text-xs text-gray-500'>
              Nepali Land Revenue registry reference required for Civil Audit verification.
            </span>
          </div>

          <input
            type='text'
            placeholder='Name'
            className={inputStyle}
            id='name'
            maxLength='62'
            minLength='5'
            required
            onChange={handleChange}
            value={formData.name}
          />
          <textarea
            placeholder='Description'
            className={inputStyle}
            id='description'
            rows='3'
            required
            onChange={handleChange}
            value={formData.description}
          />
          <input
            type='text'
            placeholder='Address'
            className={inputStyle}
            id='address'
            required
            onChange={handleChange}
            value={formData.address}
          />

          {/* CHECKBOXES */}
          <div className='flex flex-wrap gap-4'>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='sale'
                className='w-5'
                onChange={handleChange}
                checked={formData.type === 'sale'}
              />
              <span>Sell</span>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='rent'
                className='w-5'
                onChange={handleChange}
                checked={formData.type === 'rent'}
              />
              <span>Rent</span>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='parking'
                className='w-5'
                onChange={handleChange}
                checked={formData.parking}
              />
              <span>Parking spot</span>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='furnished'
                className='w-5'
                onChange={handleChange}
                checked={formData.furnished}
              />
              <span>Furnished</span>
            </div>
            <div className='flex items-center gap-2'>
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

          {/* NUMBER FIELDS */}
          <div className='flex flex-wrap gap-6'>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='bedrooms'
                min='1'
                max='10'
                required
                className='p-3 border border-gray-300 rounded-lg bg-white w-20'
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
                className='p-3 border border-gray-300 rounded-lg bg-white w-20'
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
                max='1000000000'
                required
                className='p-3 border border-gray-300 rounded-lg bg-white w-28'
                onChange={handleChange}
                value={formData.regularPrice}
              />
              <div className='flex flex-col items-start'>
                <p className='text-sm'>Regular price</p>
                <span className='text-xs text-gray-500'>(Rs. {formData.type === 'rent' ? '/ month' : ''})</span>
              </div>
            </div>
            {formData.offer && (
              <div className='flex items-center gap-2'>
                <input
                  type='number'
                  id='discountPrice'
                  min='0'
                  max='1000000000'
                  required
                  className='p-3 border border-gray-300 rounded-lg bg-white w-28'
                  onChange={handleChange}
                  value={formData.discountPrice}
                />
                <div className='flex flex-col items-start'>
                  <p className='text-sm'>Discount price</p>
                  <span className='text-xs text-gray-500'>(Rs. {formData.type === 'rent' ? '/ month' : ''})</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — CLOUDINARY IMAGES */}
        <div className='flex flex-col flex-1 gap-4 self-start'>
          <p className='font-semibold'>
            Images (Cloudinary):
            <span className='font-normal text-gray-600 ml-2'>
              The first image will be the cover (max 6)
            </span>
          </p>

          <div className='flex gap-4'>
            <input
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className='p-3 border border-gray-300 rounded w-full bg-white
              file:border-0 file:bg-gray-100 file:mr-4 file:py-2 file:rounded
              hover:file:bg-gray-200'
              type='file'
              id='images'
              accept='image/*'
              multiple
            />
            <button
              type='button'
              onClick={handleImageSubmit}
              disabled={uploading}
              className='p-3 text-green-700 border border-green-700 rounded
              uppercase hover:shadow-lg disabled:opacity-80'
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {imageUploadError && (
            <p className='text-red-700 text-sm'>{imageUploadError}</p>
          )}

          {formData.imageUrls.length > 0 &&
            formData.imageUrls.map((url, index) => (
              <div
                key={url}
                className='flex justify-between p-3 border items-center bg-white rounded-lg'
              >
                <img
                  src={url}
                  alt='listing image'
                  className='w-20 h-20 object-cover rounded-lg'
                />
                <button
                  type='button'
                  onClick={() => handleRemoveImage(index)}
                  className='p-3 text-red-700 rounded-lg uppercase hover:opacity-75'
                >
                  Delete
                </button>
              </div>
            ))}

          <button
            type='submit'
            disabled={loading || uploading}
            className='p-3 bg-slate-700 text-white rounded-lg uppercase
            hover:opacity-95 disabled:opacity-80'
          >
            {loading
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
              ? 'Update Listing'
              : 'Create Listing'}
          </button>

          {error && <p className='text-red-700 text-sm'>{error}</p>}
        </div>
      </form>
    </main>
  );
}