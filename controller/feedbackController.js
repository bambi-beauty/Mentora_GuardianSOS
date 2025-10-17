// controllers/feedbackController.js
import Feedback from '../model/Feedback.js';

export const submitFeedback = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user?.id || null;

    if (!text?.trim()) {
      return res.status(400).json({ message: 'Feedback text is required.' });
    }

    const feedback = await Feedback.create({
      user: userId,
      text,
    });

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
  }
};

export const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('user', 'name email')
      .sort({ timestamp: -1 });

    res.status(200).json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ message: 'Failed to fetch feedbacks', error: error.message });
  }
};
