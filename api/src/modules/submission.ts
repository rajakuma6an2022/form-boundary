import { Schema, model } from 'mongoose';

const submissionSchema = new Schema(
  {
    formId: { type: Schema.Types.ObjectId, ref: 'Form', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // copied so every query can filter by owner
    answers: { type: Schema.Types.Mixed, required: true, default: {} }, // keyed by field id
    formVersion: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'submissions', minimize: false },
);

submissionSchema.index({ formId: 1, createdAt: -1, _id: -1 });
submissionSchema.index({ ownerId: 1, createdAt: 1 });

export const Submission = model('Submission', submissionSchema);