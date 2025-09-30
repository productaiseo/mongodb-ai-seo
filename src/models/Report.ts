import { Schema, model, models } from 'mongoose';

const ReportSchema = new Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true },
    domain: { type: String, required: true },

    createdAt: { type: String, required: true }, // ISO string, to match your types
    updatedAt: { type: String, required: true },

    finalGeoScore: { type: Number, default: null },

    arkheReport: { type: Schema.Types.Mixed, default: null },
    prometheusReport: { type: Schema.Types.Mixed, default: null },
    delfiAgenda: { type: Schema.Types.Mixed, default: null },
    generativePerformanceReport: { type: Schema.Types.Mixed, default: null },
    performanceReport: { type: Schema.Types.Mixed, default: null },

    queryId: { type: String, default: null },
    enhancedAnalysis: { type: Schema.Types.Mixed, default: null },
  },
  { versionKey: false }
);

export const ReportModel = models.Report || model('Report', ReportSchema);
