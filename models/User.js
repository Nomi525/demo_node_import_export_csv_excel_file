import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      //   lowercase: true,
      required: false,
      default: null,
    },
    mobileNumber: {
      type: Number,
      required: false,
    },
    city: {
      type: String,
      Unique: false,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
