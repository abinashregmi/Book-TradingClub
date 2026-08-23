import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    regularPrice: { type: Number, required: true },
    discountPrice: { type: Number, required: true },
    bathrooms: { type: Number, required: true, min: 1 },
    bedrooms: { type: Number, required: true, min: 1 },
    furnished: { type: Boolean, required: true, default: false },
    parking: { type: Boolean, required: true, default: false },
    type: { type: String, required: true, enum: ['sale', 'rent'] },
    offer: { type: Boolean, required: true, default: false },
    imageUrls: { type: [String], required: true, default: [] },
    userRef: { type: String, required: true },

    // Escrow & Booking Transaction State
    bookingStatus: {
      type: String,
      enum: ['available', 'booked', 'sold'],
      default: 'available',
    },
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // E-Governance & Statutory Compliance Fields
    auditStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    lalpurjaReference: {
      type: String,
      trim: true,
      default: function () {
        return (
          this.governmentRegistrationNum ||
          `GOV-RE-2081-${Math.floor(10000 + Math.random() * 90000)}`
        );
      },
    },
    governmentRegistrationNum: {
      type: String,
      trim: true,
      default: function () {
        return (
          this.lalpurjaReference ||
          `GOV-RE-2081-${Math.floor(10000 + Math.random() * 90000)}`
        );
      },
    },
    isRegistryVerified: {
      type: Boolean,
      default: false,
    },
    taxCleared: {
      type: Boolean,
      default: false,
    },
    municipalTaxAmount: {
      type: Number,
      default: 0,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Synchronous pre-save hook for Mongoose 7/8/9 (no next callback required)
listingSchema.pre('save', function () {
  if (this.governmentRegistrationNum && !this.lalpurjaReference) {
    this.lalpurjaReference = this.governmentRegistrationNum.trim().toUpperCase();
  } else if (this.lalpurjaReference && !this.governmentRegistrationNum) {
    this.governmentRegistrationNum = this.lalpurjaReference.trim().toUpperCase();
  } else if (!this.lalpurjaReference && !this.governmentRegistrationNum) {
    const generatedRef = `GOV-RE-2081-${Math.floor(10000 + Math.random() * 90000)}`;
    this.lalpurjaReference = generatedRef;
    this.governmentRegistrationNum = generatedRef;
  }

  if (this.auditStatus === 'verified') {
    this.isRegistryVerified = true;
  } else if (this.auditStatus === 'rejected') {
    this.isRegistryVerified = false;
  }
});

const Listing = mongoose.model("Listing", listingSchema);
export default Listing;