import { Schema, model, models } from 'mongoose';

const JobEventSchema = new Schema(
  {
    jobId: { type: String, index: true, required: true },
    step: { type: String, required: true },
    status: { type: String, enum: ['STARTED', 'COMPLETED', 'FAILED'], required: true },
    meta: { type: Schema.Types.Mixed, default: null },
    ts: { type: String, required: true }, // ISO string
  },
  { versionKey: false }
);

export const JobEventModel =
  models.JobEvent || model('JobEvent', JobEventSchema);
