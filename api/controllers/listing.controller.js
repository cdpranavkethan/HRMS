import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

export const createListing = async (req, res, next) => {
  try {
    console.log('Received createListing request:', req.body); // Debug: Log incoming data
    const {
      imageUrls,
      name,
      description,
      address,
      type,
      bedrooms,
      bathrooms,
      regularPrice,
      discountPrice,
      offer,
      parking,
      furnished,
      userRef,
      mapUrl,
      forStudents,
      hostelType,
    } = req.body;

    // Validate required fields
    if (!imageUrls || imageUrls.length === 0) {
      console.log('Validation failed: No media files');
      return res.status(400).json({ success: false, message: 'At least one media file is required' });
    }
    if (!name || !description || !address || !type || !bedrooms || !bathrooms || !regularPrice || discountPrice === undefined) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (offer && Number(regularPrice) < Number(discountPrice)) {
      console.log('Validation failed: Discount price issue');
      return res.status(400).json({ success: false, message: 'Discount price must be lower than regular price' });
    }
    // Optional: Validate mapUrl format
    if (mapUrl && !mapUrl.startsWith('https://www.google.com/maps/embed')) {
      console.log('Validation failed: Invalid map URL');
      return res.status(400).json({ success: false, message: 'Invalid map URL' });
    }

    // Create listing data object
    const listingData = {
      imageUrls,
      name,
      description,
      address,
      type,
      bedrooms,
      bathrooms,
      regularPrice,
      discountPrice,
      offer,
      parking,
      furnished,
      userRef,
      mapUrl,
      forStudents,
    };

    // Only include hostelType if forStudents is true
    if (forStudents) {
      if (!hostelType) {
        return res.status(400).json({ success: false, message: 'Hostel type is required for student listings' });
      }
      listingData.hostelType = hostelType;
    }

    // Create new listing
    const newListing = new Listing(listingData);

    // Save to MongoDB
    const savedListing = await newListing.save();
    console.log('Listing saved:', savedListing); // Debug: Log saved listing

    res.status(201).json(savedListing);
  } catch (error) {
    console.error('createListing error:', error); // Debug: Log errors
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(errorHandler(404, 'Listing not found!'));
  }

  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, 'You can only delete your own listings!'));
  }

  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json('Listing has been deleted!');
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return next(errorHandler(404, 'Listing not found!'));
  }
  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, 'You can only update your own listings!'));
  }

  try {
    const {
      imageUrls,
      name,
      description,
      address,
      type,
      bedrooms,
      bathrooms,
      regularPrice,
      discountPrice,
      offer,
      parking,
      furnished,
      mapUrl, // Added mapUrl
      forStudents, // Added forStudents
    } = req.body;

    // Validate required fields
    if (!imageUrls || imageUrls.length === 0) {
      return next(errorHandler(400, 'At least one media file is required'));
    }
    if (!name || !description || !address || !type || !bedrooms || !bathrooms || !regularPrice || discountPrice === undefined) {
      return next(errorHandler(400, 'Missing required fields'));
    }
    if (offer && Number(regularPrice) < Number(discountPrice)) {
      return next(errorHandler(400, 'Discount price must be lower than regular price'));
    }
    if (mapUrl && !mapUrl.startsWith('https://www.google.com/maps/embed')) {
      return next(errorHandler(400, 'Invalid map URL'));
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          imageUrls,
          name,
          description,
          address,
          type,
          bedrooms,
          bathrooms,
          regularPrice,
          discountPrice,
          offer,
          parking,
          furnished,
          mapUrl, // Added mapUrl
          forStudents, // Added forStudents
        },
      },
      { new: true }
    );

    res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found!'));
    }
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;
    let offer = req.query.offer;

    if (offer === undefined || offer === 'false') {
      offer = { $in: [false, true] };
    }

    let furnished = req.query.furnished;

    if (furnished === undefined || furnished === 'false') {
      furnished = { $in: [false, true] };
    }

    let parking = req.query.parking;

    if (parking === undefined || parking === 'false') {
      parking = { $in: [false, true] };
    }

    let type = req.query.type;

    if (type === undefined || type === 'all') {
      type = { $in: ['sale', 'rent'] };
    }

    const searchTerm = req.query.searchTerm || '';

    const sort = req.query.sort || 'createdAt';

    const order = req.query.order || 'desc';

    const listings = await Listing.find({
      name: { $regex: searchTerm, $options: 'i' },
      offer,
      furnished,
      parking,
      type,
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};