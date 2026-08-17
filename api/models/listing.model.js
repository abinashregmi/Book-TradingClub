import mongoose from "mongoose";
import { use } from "react";

const listingSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    description:{
        type: String,
        required: true,
    },
    address:{
        type: String,
        required: true,    
    },
    regularPrice:{
        type: Number,
        required: true,
    },
    discountPrice:{
        type: Number,
        required: true,
    },
    bathrooms:{
        type: Number,
        required: true,
    },
    bedrooms:{
        type: Number,
        required: true,
    },
    furnished:{
        type: Boolean,
        required: true,
    },
    parking:{
        type: Boolean,
        required: true,
    },
    type:{
        type: String,
        required: true,
    },
    offer:{
        type: Boolean,
        required: true,
    },
    imageUrls:{
        type: Array,
        required: true,
    },
    userRef:{
        type: String,
        required: true,
    }, 
    bookingStatus: {
        type:String,
        enum: ['available', 'booked', 'sold'],
        default: 'available',
    }
},{timestamps: true});

const Listing = mongoose.model("Listing", listingSchema);

export default Listing;

