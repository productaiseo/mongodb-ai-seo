import { Schema, model, models } from 'mongoose';
import type { Model } from 'mongoose';
import type { AnalysisJob } from '@/types/geo';

const AnalysisJobSchema = new Schema<AnalysisJob>(
  {
    id: { type: String, required: true, unique: true, index: true },
    queryId: { type: String },
    userId: { type: String, required: true },
    url: { type: String, required: true },
    urlHost: { type: String, index: true },
    locale: String,
    status: {
      type: String,
      enum: [
        'QUEUED',
        'PROCESSING_SCRAPE',
        'PROCESSING_PSI',
        'PROCESSING_ARKHE',
        'PROCESSING_PROMETHEUS',
        'PROCESSING_LIR',
        'PROCESSING_GENERATIVE_PERFORMANCE',
        'PROCESSING_STRATEGIC_IMPACT',
        'COMPLETED',
        'FAILED',
      ],
      required: true,
    },
    finalGeoScore: { type: Number, default: null },

    scrapedContent: { type: String },
    scrapedHtml: { type: String },

    arkheReport: { type: Schema.Types.Mixed },
    prometheusReport: { type: Schema.Types.Mixed },
    delfiAgenda: { type: Schema.Types.Mixed },
    generativePerformanceReport: { type: Schema.Types.Mixed },
    strategicImpactForecast: { type: Schema.Types.Mixed },
    performanceReport: { type: Schema.Types.Mixed },

    error: { type: String },
    topQueries: [
      {
        query: String,
        volume: Number,
        position: Number,
        _id: false,
      },
    ],
    createdAt: { type: String, required: true }, // keep ISO string to match your type
    updatedAt: { type: String, required: true },
  },
  {
    versionKey: false,
    // If you want Mongo to keep its own Date timestamps in addition to your ISO strings,
    // you can also enable timestamps: true
  }
);

export const AnalysisJobModel: Model<AnalysisJob> =
  (models.AnalysisJob as Model<AnalysisJob>) || model<AnalysisJob>('AnalysisJob', AnalysisJobSchema);
