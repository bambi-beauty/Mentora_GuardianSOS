import mongoose from 'mongoose';

const CoordinatesSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
});

const IncidentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    locationText: {
      type: String,
      required: true,
    },
    coordinates: {
      type: CoordinatesSchema,
      required: false, // Because sometimes locationText only may be provided
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    geminiAnalysis: {
      type: mongoose.Schema.Types.Mixed, // Flexible to store AI analysis object
    },
    dangerLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

const Incident = mongoose.model('Incident', IncidentSchema);

export default Incident;
