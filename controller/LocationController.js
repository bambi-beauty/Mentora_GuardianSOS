// controllers/locationController.js

import Location from '../model/Location.js';

export const createLocation = async (req, res) => {
  try {
    const { country, city, street } = req.body;

    if (!country || !city || !street) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const location = new Location({
      country,
      city,
      street,
      user: req.user._id, // comes from auth middleware
    });

    await location.save();

    res.status(201).json({
      message: 'Location saved successfully',
      location,
    });
  } catch (error) {
    console.error('Create Location Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
