import mongoose from 'mongoose';

// Standardized internal canonical roles
export const USER_ROLES = {
  CITIZEN: 'citizen',
  AGENT: 'agent',
  ADMIN: 'admin',
};

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default:
        'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
    },
    role: {
      type: String,
      required: true,
      default: 'citizen',
      // Normalizes variations ("user" -> "citizen", "Government_Officer" -> "admin") before persisting
      set: function (val) {
        if (!val) return 'citizen';
        const formatted = String(val).trim().toLowerCase();
        if (formatted === 'user' || formatted === 'citizen') return 'citizen';
        if (formatted === 'agent') return 'agent';
        if (
          formatted === 'admin' ||
          formatted === 'government_officer' ||
          formatted === 'government officer'
        ) {
          return 'admin';
        }
        return formatted;
      },
      enum: ['citizen', 'agent', 'admin'],
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;