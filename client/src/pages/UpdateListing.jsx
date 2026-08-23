import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

export default function UpdateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const params = useParams();
  const listingId = params.listingId;

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
    governmentRegistrationNum: '',
  });

  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Fetch current listing details on component mount
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setFetchLoading(true);
        const res = await fetch(`/api/listing/get/${listingId}`);
        const data = await res.json();

        if (data.success === false) {
          setError(data.message || 'Failed to retrieve listing details');
          setFetchLoading(false);
          return;
        }

        // Verify that the current user owns this listing or is an admin
        if (
          data.userRef !== currentUser?._id &&
          currentUser?.role !== 'admin' &&
          currentUser?.role !== 'Government_Officer'
        ) {
          setError('Unauthorized: You are not authorized to update this listing.');
          setFetchLoading(false);
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
      } catch (err) {
        setError(err.message || 'Error communicating with server');
      } finally {
        setFetchLoading(false);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId, currentUser]);

  // Cloudinary image upload utility
  const storeImageCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'faylt7ob';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', uploadPreset);
    uploadData.append('folder', 'samples/ecommerce');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: uploadData,
    });

    const data = await res.json();
    if (!res.ok || !data.secure_url) {
      throw new Error(data.error?.message || `Upload failed with status ${res.status}`);
    }

    return data.secure_url;
  };

  const handleImageSubmit = (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setImageUploadError('Please select at least one image file');
      return;
    }

    if (files.length + formData.imageUrls.length <= 6) {
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
          setImageUploadError(err.message || 'Image upload failed.');
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
        return setError('Government Registration Number (Lalpurja Reference) is required');
      }
      if (formData.offer && +formData.regularPrice < +formData.discountPrice) {
        return setError('Discounted price must be lower than regular price');
      }

      setLoading(true);
      setError(false);

      const res = await fetch(`/api/listing/update/${listingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          governmentRegistrationNum: formData.governmentRegistrationNum.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success === false) {
        setError(data.message);
        return;
      }

      navigate(`/listing/${listingId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-xl font-semibold text-slate-700">Loading listing details...</p>
      </div>
    );
  }

  return (
    <main className="p-3 max-w-4xl mx-auto min-h-[80vh]">
      <h1 className="text-3xl font-bold text-center my-7 text-slate-800">
        Update Property Listing
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-6">
        {/* LEFT COLUMN: LISTING DETAILS */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Government Registration Number Field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-slate-700">
              Government Registration Number (Lalpurja Reference) *
            </label>
            <input
              type="text"
              placeholder="e.g. GOV-RE-2081-09412"
              className={inputStyle}
              id="governmentRegistrationNum"
              required
              onChange={handleChange}
              value={formData.governmentRegistrationNum}
            />
            <span className="text-xs text-gray-500">
              Nepali Land Revenue registry reference required for Civil Audit verification.
            </span>
          </div>

          <input
            type="text"
            placeholder="Property Name"
            className={inputStyle}
            id="name"
            maxLength="62"
            minLength="5"
            required
            onChange={handleChange}
            value={formData.name}
          />
          <textarea
            placeholder="Property Description"
            className={inputStyle}
            id="description"
            rows="3"
            required
            onChange={handleChange}
            value={formData.description}
          />
          <input
            type="text"
            placeholder="Property Address"
            className={inputStyle}
            id="address"
            required
            onChange={handleChange}
            value={formData.address}
          />

          {/* CHECKBOXES */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sale"
                className="w-5"
                onChange={handleChange}
                checked={formData.type === 'sale'}
              />
              <span className="text-sm font-medium">Sell</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rent"
                className="w-5"
                onChange={handleChange}
                checked={formData.type === 'rent'}
              />
              <span className="text-sm font-medium">Rent</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="parking"
                className="w-5"
                onChange={handleChange}
                checked={formData.parking}
              />
              <span className="text-sm font-medium">Parking spot</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="furnished"
                className="w-5"
                onChange={handleChange}
                checked={formData.furnished}
              />
              <span className="text-sm font-medium">Furnished</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="offer"
                className="w-5"
                onChange={handleChange}
                checked={formData.offer}
              />
              <span className="text-sm font-medium">Special Offer</span>
            </div>
          </div>

          {/* NUMERIC METRICS */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="bedrooms"
                min="1"
                max="10"
                required
                className="p-3 border border-gray-300 rounded-lg bg-white w-20"
                onChange={handleChange}
                value={formData.bedrooms}
              />
              <p className="text-sm">Beds</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="bathrooms"
                min="1"
                max="10"
                required
                className="p-3 border border-gray-300 rounded-lg bg-white w-20"
                onChange={handleChange}
                value={formData.bathrooms}
              />
              <p className="text-sm">Baths</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="regularPrice"
                min="50"
                max="1000000000"
                required
                className="p-3 border border-gray-300 rounded-lg bg-white w-28"
                onChange={handleChange}
                value={formData.regularPrice}
              />
              <div className="flex flex-col items-start">
                <p className="text-sm">Regular price</p>
                <span className="text-xs text-gray-500">
                  (Rs. {formData.type === 'rent' ? '/ month' : ''})
                </span>
              </div>
            </div>
            {formData.offer && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="discountPrice"
                  min="0"
                  max="1000000000"
                  required
                  className="p-3 border border-gray-300 rounded-lg bg-white w-28"
                  onChange={handleChange}
                  value={formData.discountPrice}
                />
                <div className="flex flex-col items-start">
                  <p className="text-sm">Discount price</p>
                  <span className="text-xs text-gray-500">
                    (Rs. {formData.type === 'rent' ? '/ month' : ''})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: IMAGES & ACTION BUTTONS */}
        <div className="flex flex-col flex-1 gap-4 self-start">
          <p className="font-semibold text-slate-800">
            Images (Cloudinary):
            <span className="font-normal text-gray-600 ml-2">
              The first image will be the cover (max 6)
            </span>
          </p>

          <div className="flex gap-4">
            <input
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="p-3 border border-gray-300 rounded w-full bg-white file:border-0 file:bg-gray-100 file:mr-4 file:py-2 file:rounded hover:file:bg-gray-200"
              type="file"
              id="images"
              accept="image/*"
              multiple
            />
            <button
              type="button"
              onClick={handleImageSubmit}
              disabled={uploading}
              className="p-3 text-green-700 border border-green-700 rounded uppercase hover:shadow-lg disabled:opacity-80 font-semibold"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {imageUploadError && (
            <p className="text-red-700 text-sm font-semibold">{imageUploadError}</p>
          )}

          {formData.imageUrls.length > 0 &&
            formData.imageUrls.map((url, index) => (
              <div
                key={url}
                className="flex justify-between p-3 border items-center bg-white rounded-lg shadow-xs"
              >
                <img
                  src={url}
                  alt="listing image"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="p-3 text-red-700 rounded-lg uppercase hover:opacity-75 font-semibold text-xs"
                >
                  Delete
                </button>
              </div>
            ))}

          <button
            type="submit"
            disabled={loading || uploading}
            className="p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80 font-bold transition mt-2 cursor-pointer"
          >
            {loading ? 'Updating Listing...' : 'Update Listing'}
          </button>

          {error && <p className="text-red-700 text-sm font-semibold">{error}</p>}
        </div>
      </form>
    </main>
  );
}