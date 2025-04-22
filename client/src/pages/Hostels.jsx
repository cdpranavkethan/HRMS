import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css/bundle';
import ListingItem from '../components/ListingItem';

export default function Hostels() {
  const [studentListings, setStudentListings] = useState([]);
  const [loading, setLoading] = useState(false);
  SwiperCore.use([Navigation]);

  useEffect(() => {
    const fetchStudentListings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/listing/get?forStudents=true');
        const data = await res.json();
        const onlyStudentListings = data.filter(listing => listing.forStudents === true);
        setStudentListings(onlyStudentListings);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchStudentListings();
  }, []);

  return (
    <div>
      {/* top */}
      <div className='flex flex-col gap-6 p-28 px-3 max-w-6xl mx-auto'>
        <h1 className='text-slate-700 font-bold text-3xl lg:text-6xl'>
          Find Your Perfect <span className='text-slate-500'>Student Hostel</span>
          <br />
          near your college
        </h1>
        <div className='text-gray-400 text-xs sm:text-sm'>
          Discover student-verified hostels with the amenities you need.
          <br />
          All listings here are specifically marked as student-friendly accommodations.
        </div>
        <Link
          to={'/hostel-search'}
          className='text-xs sm:text-sm text-blue-800 font-bold hover:underline'
        >
          Browse all student hostels...
        </Link>
      </div>

      {/* Featured Hostels Swiper */}
      {studentListings.length > 0 && (
        <div className='mb-10'>
          <Swiper navigation>
            {studentListings.slice(0, 5).map((listing) => (
              <SwiperSlide key={listing._id}>
                <div
                  style={{
                    background: `url(${listing.imageUrls[0]}) center no-repeat`,
                    backgroundSize: 'cover',
                  }}
                  className='h-[500px]'
                ></div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Student Hostel Listings */}
      <div className='max-w-6xl mx-auto p-3'>
        {loading ? (
          <p className='text-center text-2xl mt-10'>Loading...</p>
        ) : studentListings.length === 0 ? (
          <p className='text-center text-2xl mt-10'>No student hostels available at the moment.</p>
        ) : (
          <div>
            <div className='my-3'>
              <h2 className='text-2xl font-semibold text-slate-600'>Student-Friendly Hostels</h2>
              <p className='text-sm text-slate-500 mt-2'>
                Showing verified student accommodations only
              </p>
            </div>
            <div className='flex flex-wrap gap-4'>
              {studentListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
