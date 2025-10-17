import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const FeedbackSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Feedback = model('Feedback', FeedbackSchema);

export default Feedback;
