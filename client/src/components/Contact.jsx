import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export default function Contact({ listing }) {
  const { currentUser } = useSelector((state) => state.user);
  const [landlord, setLandlord] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => {
    setMessage(e.target.value);
  };

  useEffect(() => {
    const fetchLandlord = async () => {
      try {
        const res = await fetch(`/api/user/${listing.userRef}`);
        const data = await res.json();
        setLandlord(data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchLandlord();
  }, [listing.userRef]);

  // Handle saving inquiry directly into MongoDB
  const handleSendInquiry = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter a message before sending.');
      return;
    }

    try {
      setSending(true);
      setError(null);

      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing._id,
          message,
          senderName: currentUser?.username || 'Interested Buyer',
          senderEmail: currentUser?.email || '',
        }),
      });

      const data = await res.json();

      if (data.success === false) {
        setError(data.message || 'Failed to submit inquiry.');
        setSending(false);
        return;
      }

      setSuccess(true);
      setSending(false);
      setMessage('');
    } catch (err) {
      setError(err.message || 'Error communicating with the database.');
      setSending(false);
    }
  };

  return (
    <>
      {landlord && (
        <div className='flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 mt-2 shadow-xs'>
          <p className='text-sm text-slate-700'>
            Contact Landlord: <span className='font-bold text-slate-900'>{landlord.username}</span> for{' '}
            <span className='font-semibold text-slate-800'>{listing.name}</span>
          </p>

          {success ? (
            <div className='p-3 bg-green-50 border border-green-300 text-green-800 rounded-lg text-sm font-semibold text-center'>
              ✓ Inquiry sent to landlord! They have received your message in their portal.
            </div>
          ) : (
            <form onSubmit={handleSendInquiry} className='flex flex-col gap-3'>
              <textarea
                name='message'
                id='message'
                rows='3'
                value={message}
                onChange={onChange}
                placeholder='Enter your inquiry regarding this property...'
                className='w-full border border-slate-300 p-3 rounded-lg text-sm focus:outline-none focus:border-slate-500 bg-white'
                required
              />

              {error && <p className='text-red-600 text-xs font-semibold'>{error}</p>}

              <div className='flex flex-col sm:flex-row gap-2'>
                <button
                  type='submit'
                  disabled={sending}
                  className='flex-1 bg-slate-700 text-white text-center p-3 uppercase rounded-lg hover:opacity-95 text-xs font-bold transition disabled:opacity-70'
                >
                  {sending ? 'Sending...' : 'Send Inquiry (Save to DB)'}
                </button>

                {message.trim() && (
                  <Link
                    to={`mailto:${landlord.email}?subject=Regarding ${encodeURIComponent(listing.name)}&body=${encodeURIComponent(message)}`}
                    className='bg-slate-200 hover:bg-slate-300 text-slate-700 text-center p-3 uppercase rounded-lg text-xs font-semibold transition'
                  >
                    Open in Email App
                  </Link>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}