import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    regularPrice: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
      required: true,
    },
    bathrooms: {
      type: Number,
      required: true,
    },
    bedrooms: {
      type: Number,
      required: true,
    },
    furnished: {
      type: Boolean,
      required: true,
    },
    parking: {
      type: Boolean,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    offer: {
      type: Boolean,
      required: true,
    },
    imageUrls: {
      type: Array,
      required: true,
    },
    userRef: {
      type: String,
      required: true,
    },
    mapUrl: {
      type: String,
      required: false, // Optional field
    },
    forStudents: {
      type: Boolean,
      required: true,
      default: false,
    },
    hostelType: {
      type: String,
      enum: ['girls', 'boys', 'co'],
      required: function() {
        return this.forStudents;
      },
      validate: {
        validator: function(v) {
          return !this.forStudents || (v && ['girls', 'boys', 'co'].includes(v));
        },
        message: 'Hostel type is required when listing is marked for students'
      }
    },
  },
  { timestamps: true }
);

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;