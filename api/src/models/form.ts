import { Schema, model } from 'mongoose';

export const FIELD_TYPES = ['text', 'email', 'textarea', 'select', 'checkbox'] as const;
export const FORM_STATUSES = ['DRAFT', 'PUBLISHED', 'CLOSED'] as const;
export const MAX_FIELDS = 50;

const fieldSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: FIELD_TYPES, required: true },
    label: { type: String, required: true, trim: true, maxlength: 200 },
    placeholder: { type: String, maxlength: 200 },
    helpText: { type: String, maxlength: 300 },
    required: { type: Boolean, default: false },
    options: { type: [String], default: undefined }, // only used by select
    minLength: { type: Number, min: 0 },
    maxLength: { type: Number, min: 1 },
  },
  { _id: false },
);

const formSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String }, // set on publish; deliberately no default
    status: { type: String, enum: FORM_STATUSES, default: 'DRAFT', required: true },
    fields: {
      type: [fieldSchema],
      default: [],
      validate: {
        validator: (value: unknown[]) => value.length <= MAX_FIELDS,
        message: `A form can have at most ${MAX_FIELDS} fields`,
      },
    },
    version: { type: Number, default: 1 },
  },
  { timestamps: true, collection: 'forms' },
);

formSchema.index({ ownerId: 1, updatedAt: -1, _id: -1 });
// $type:'string' (not $exists) so a null slug can never collide with another null.
formSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $type: 'string' } } },
);

export const Form = model('Form', formSchema);