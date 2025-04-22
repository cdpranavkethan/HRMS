import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListingItem from '../components/ListingItem';

export default function HostelSearch() {
  const navigate = useNavigate();
  const [sidebardata, setSidebardata] = useState({
    searchTerm: '',
    hostelType: 'all',
    parking: false,
    furnished: false,
    offer: false,
    sort: 'createdAt',
    order: 'desc',
  });

  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    const hostelTypeFromUrl = urlParams.get('hostelType');
    const parkingFromUrl = urlParams.get('parking');
    const furnishedFromUrl = urlParams.get('furnished');
    const offerFromUrl = urlParams.get('offer');

    if (
      searchTermFromUrl ||
      hostelTypeFromUrl ||
      parkingFromUrl ||
      furnishedFromUrl ||
      offerFromUrl
    ) {
      setSidebardata({
        searchTerm: searchTermFromUrl || '',
        hostelType: hostelTypeFromUrl || 'all',
        parking: parkingFromUrl === 'true' ? true : false,
        furnished: furnishedFromUrl === 'true' ? true : false,
        offer: offerFromUrl === 'true' ? true : false,
        sort: 'createdAt',
        order: 'desc',
      });
    }

    const fetchListings = async () => {
      try {
        setLoading(true);
        setShowMore(false);
        const urlParams = new URLSearchParams(location.search);
        
        // Always include forStudents=true and remove any existing forStudents parameter
        urlParams.delete('forStudents');
        urlParams.set('forStudents', 'true');
        
        // Handle hostel type filtering
        if (sidebardata.hostelType === 'co') {
          urlParams.set('hostelType', 'co');
        } else if (sidebardata.hostelType === 'boys') {
          urlParams.set('hostelType', 'boys');
        } else if (sidebardata.hostelType === 'girls') {
          urlParams.set('hostelType', 'girls');
        } else {
          urlParams.delete('hostelType');
        }

        // Always sort by latest
        urlParams.set('sort', 'createdAt');
        urlParams.set('order', 'desc');
        
        const searchQuery = urlParams.toString();
        console.log('Fetching with query:', searchQuery); // Debug log
        
        const res = await fetch(`/api/listing/get?${searchQuery}`);
        const data = await res.json();
        
        // Filter listings
        let filteredListings = sidebardata.hostelType === 'all' 
          ? data.filter(listing => listing.forStudents === true)
          : data.filter(listing => 
              listing.forStudents === true && 
              listing.hostelType === sidebardata.hostelType
            );
        
        if (filteredListings.length > 8) {
          setShowMore(true);
        } else {
          setShowMore(false);
        }
        
        setListings(filteredListings);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchListings();
  }, [location.search]);

  const handleChange = (e) => {
    if (
      e.target.id === 'all' ||
      e.target.id === 'boys' ||
      e.target.id === 'girls' ||
      e.target.id === 'co'
    ) {
      setSidebardata({ ...sidebardata, hostelType: e.target.id });
    }

    if (e.target.id === 'searchTerm') {
      setSidebardata({ ...sidebardata, searchTerm: e.target.value });
    }

    if (
      e.target.id === 'parking' ||
      e.target.id === 'furnished' ||
      e.target.id === 'offer'
    ) {
      setSidebardata({
        ...sidebardata,
        [e.target.id]:
          e.target.checked || e.target.checked === 'true' ? true : false,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
    urlParams.set('searchTerm', sidebardata.searchTerm);
    urlParams.set('hostelType', sidebardata.hostelType);
    urlParams.set('parking', sidebardata.parking);
    urlParams.set('furnished', sidebardata.furnished);
    urlParams.set('offer', sidebardata.offer);
    const searchQuery = urlParams.toString();
    navigate(`/hostel-search?${searchQuery}`);
  };

  const onShowMoreClick = async () => {
    const numberOfListings = listings.length;
    const startIndex = numberOfListings;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('startIndex', startIndex);
    
    // Always include forStudents=true and remove any existing forStudents parameter
    urlParams.delete('forStudents');
    urlParams.set('forStudents', 'true');
    
    // Handle hostel type filtering
    if (sidebardata.hostelType === 'co') {
      urlParams.set('hostelType', 'co');
    } else if (sidebardata.hostelType === 'boys') {
      urlParams.set('hostelType', 'boys');
    } else if (sidebardata.hostelType === 'girls') {
      urlParams.set('hostelType', 'girls');
    } else {
      urlParams.delete('hostelType');
    }

    // Always sort by latest
    urlParams.set('sort', 'createdAt');
    urlParams.set('order', 'desc');
    
    const searchQuery = urlParams.toString();
    console.log('Fetching more with query:', searchQuery); // Debug log
    
    try {
      const res = await fetch(`/api/listing/get?${searchQuery}`);
      const data = await res.json();
      
      // Filter listings
      let filteredListings = sidebardata.hostelType === 'all' 
        ? data.filter(listing => listing.forStudents === true)
        : data.filter(listing => 
            listing.forStudents === true && 
            listing.hostelType === sidebardata.hostelType
          );
      
      if (filteredListings.length < 9) {
        setShowMore(false);
      }
      
      setListings([...listings, ...filteredListings]);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className='flex flex-col md:flex-row'>
      <div className='p-7 border-b-2 md:border-r-2 md:min-h-screen'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-8'>
          <div className='flex items-center gap-2'>
            <label className='whitespace-nowrap font-semibold'>
              Search Term:
            </label>
            <input
              type='text'
              id='searchTerm'
              placeholder='Search...'
              className='border rounded-lg p-3 w-full'
              value={sidebardata.searchTerm}
              onChange={handleChange}
            />
          </div>

          <div className='flex gap-2 flex-wrap items-center'>
            <label className='font-semibold'>Hostel Type:</label>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='all'
                className='w-5'
                onChange={handleChange}
                checked={sidebardata.hostelType === 'all'}
              />
              <span>All Types</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='boys'
                className='w-5'
                onChange={handleChange}
                checked={sidebardata.hostelType === 'boys'}
              />
              <span>Boys Hostel</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='girls'
                className='w-5'
                onChange={handleChange}
                checked={sidebardata.hostelType === 'girls'}
              />
              <span>Girls Hostel</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='co'
                className='w-5'
                onChange={handleChange}
                checked={sidebardata.hostelType === 'co'}
              />
              <span>Co-ed Hostel</span>
            </div>
          </div>

          <div className='flex gap-2 flex-wrap items-center'>
            <label className='font-semibold'>Amenities:</label>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='parking'
                className='w-5'
                onChange={handleChange}
                checked={sidebardata.parking}
              />
              <span>Parking</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='furnished'
                className='w-5'
                onChange={handleChange}
                checked={sidebardata.furnished}
              />
              <span>Furnished</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='offer'
                className='w-5'
                onChange={handleChange}
                checked={sidebardata.offer}
              />
              <span>Offer</span>
            </div>
          </div>

          <button className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95'>
            Search
          </button>
        </form>
      </div>

      <div className='flex-1'>
        <h1 className='text-3xl font-semibold border-b p-3 text-slate-700 mt-5'>
          Student Hostel Results
        </h1>
        <div className='p-7 flex flex-wrap gap-4'>
          {!loading && listings.length === 0 && (
            <p className='text-xl text-slate-700'>No hostels found!</p>
          )}
          {loading && (
            <p className='text-xl text-slate-700 text-center w-full'>Loading...</p>
          )}
          {!loading &&
            listings &&
            listings.map((listing) => (
              <ListingItem key={listing._id} listing={listing} />
            ))}
          {showMore && (
            <button
              onClick={onShowMoreClick}
              className='text-green-700 hover:underline p-7 text-center w-full'
            >
              Show more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
