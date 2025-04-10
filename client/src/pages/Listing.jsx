import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css/bundle';
import { useSelector } from 'react-redux';
import {
  FaBath,
  FaBed,
  FaChair,
  FaMapMarkerAlt,
  FaParking,
  FaShare,
} from 'react-icons/fa';
import Contact from '../components/Contact';

export default function Listing() {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState(false);
  const [isPaid, setIsPaid] = useState(false); // Tracks payment success
  const params = useParams();
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/listing/get/${params.listingId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(true);
          setLoading(false);
          return;
        }
        setListing(data);
        setLoading(false);
        setError(false);
      } catch (error) {
        setError(true);
        setLoading(false);
      }
    };
    fetchListing();
  }, [params.listingId]);

  const paymentHandler = async (e) => {
    e.preventDefault();

    const amount = 500 * 100; // ₹500 in paise
    const currency = "INR";
    const receiptId = "qwsaq1";

    try {
      // Step 1: Create order
      const response = await fetch("/api/order", {
        method: "POST",
        body: JSON.stringify({
          amount,
          currency,
          receipt: receiptId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Order creation failed:", response.status, errorData);
        return;
      }

      const order = await response.json();

      if (!order.id) {
        console.error("No order ID in response");
        return;
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: "rzp_test_qKDmABQedmUB76", // Matches server-side key_id
        amount,
        currency,
        name: "Acme Corp",
        description: "Test Transaction",
        image: "https://example.com/your_logo",
        order_id: order.id,
        handler: async function (response) {
          // Step 3: Validate payment
          const body = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          };

          const validateRes = await fetch("/api/order/validate", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!validateRes.ok) {
            const errorData = await validateRes.text();
            console.error("Validation failed:", validateRes.status, errorData);
            return;
          }

          const jsonRes = await validateRes.json();

          // Step 4: Update state on success
          console.log(jsonRes);
          if (jsonRes.msg === "success") {
            setIsPaid(true); // Set isPaid to true after successful validation
            console.log("Payment successful, isPaid set to true");
          }
        },
        prefill: {
          name: "Web Dev Matrix",
          email: "webdevmatrix@example.com",
          contact: "9000000000",
        },
        notes: {
          address: "Razorpay Corporate Office",
        },
        theme: {
          color: "#3399cc",
        },
      };

      if (!window.Razorpay) {
        console.error("Razorpay script not loaded!");
        alert("Payment gateway not available. Please try again later.");
        return;
      }

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        alert(response.error.description);
      });
      rzp1.open();
    } catch (error) {
      console.error("Payment handler error:", error);
    }
  };

  return (
    <main>
      {loading && <p className='text-center my-7 text-2xl'>Loading...</p>}
      {error && (
        <p className='text-center my-7 text-2xl'>Something went wrong!</p>
      )}
      {listing && !loading && !error && (
        <div>
          <Swiper navigation={true} modules={[Navigation]}>
            {listing.imageUrls.map((url) => (
              <SwiperSlide key={url}>
                <div
                  className='h-[550px]'
                  style={{
                    background: `url(${url}) center no-repeat`,
                    backgroundSize: 'cover',
                  }}
                ></div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className='fixed top-[13%] right-[3%] z-10 border rounded-full w-12 h-12 flex justify-center items-center bg-slate-100 cursor-pointer'>
            <FaShare
              className='text-slate-500'
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 2000);
              }}
            />
          </div>
          {copied && (
            <p className='fixed top-[23%] right-[5%] z-10 rounded-md bg-slate-100 p-2'>
              Link copied!
            </p>
          )}
          <div className='flex flex-col max-w-4xl mx-auto p-3 my-7 gap-4'>
            <p className='text-2xl font-semibold'>
              {listing.name} - ${' '}
              {listing.offer
                ? listing.discountPrice.toLocaleString('en-US')
                : listing.regularPrice.toLocaleString('en-US')}
              {listing.type === 'rent' && ' / month'}
            </p>
            <p className='flex items-center mt-6 gap-2 text-slate-600 text-sm'>
              <FaMapMarkerAlt className='text-green-700' />
              {listing.address}
            </p>
            <div className='flex gap-4'>
              <p className='bg-red-900 w-full max-w-[200px] text-white text-center p-1 rounded-md'>
                {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
              </p>
              {listing.offer && (
                <p className='bg-green-900 w-full max-w-[200px] text-white text-center p-1 rounded-md'>
                  ${+listing.regularPrice - +listing.discountPrice} OFF
                </p>
              )}
            </div>
            <p className='text-slate-800'>
              <span className='font-semibold text-black'>Description - </span>
              {listing.description}
            </p>
            <ul className='text-green-900 font-semibold text-sm flex flex-wrap items-center gap-4 sm:gap-6'>
              <li className='flex items-center gap-1 whitespace-nowrap'>
                <FaBed className='text-lg' />
                {listing.bedrooms > 1
                  ? `${listing.bedrooms} beds `
                  : `${listing.bedrooms} bed `}
              </li>
              <li className='flex items-center gap-1 whitespace-nowrap'>
                <FaBath className='text-lg' />
                {listing.bathrooms > 1
                  ? `${listing.bathrooms} baths `
                  : `${listing.bathrooms} bath `}
              </li>
              <li className='flex items-center gap-1 whitespace-nowrap'>
                <FaParking className='text-lg' />
                {listing.parking ? 'Parking spot' : 'No Parking'}
              </li>
              <li className='flex items-center gap-1 whitespace-nowrap'>
                <FaChair className='text-lg' />
                {listing.furnished ? 'Furnished' : 'Unfurnished'}
              </li>
            </ul>
            {currentUser && listing.userRef !== currentUser._id && !contact && (
              <>
                <button
                  onClick={() => setContact(true)}
                  className='bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 p-3'
                >
                  Contact landlord
                </button>
                <button
                  onClick={!isPaid ? paymentHandler : undefined} // Only clickable if not paid
                  className={`bg-slate-700 text-white rounded-lg uppercase p-3 ${
                    isPaid ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95'
                  }`}
                  disabled={isPaid} // Disable button after payment
                >
                  {isPaid ? 'Visit confirmed' : 'Book a visit'} {/* Text changes based on isPaid */}
                </button>
              </>
            )}
            {contact && <Contact listing={listing} />}
          </div>
        </div>
      )}
    </main>
  );
}