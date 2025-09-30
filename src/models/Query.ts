import { Schema, model, models } from 'mongoose';

const QuerySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true }, // mirrors Firestore doc id
    status: { type: String, required: true },
    updatedAt: { type: String, required: true }, // ISO
    // Optional: owner info, title, etc.
  },
  { versionKey: false }
);

export const QueryModel = models.Query || model('Query', QuerySchema);
