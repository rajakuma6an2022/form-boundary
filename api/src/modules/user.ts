import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    // select:false so the hash never leaks by accident. Login must use .select('+passwordHash').
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'users' },
);

userSchema.index({ email: 1 }, { unique: true });

export const User = model('User', userSchema);