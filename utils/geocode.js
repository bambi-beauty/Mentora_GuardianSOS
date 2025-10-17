import fetch from 'node-fetch';

export const geocodeLocation = async (locationText) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationText)}&key=${apiKey}`
  );
  const data = await response.json();
  if (data.results.length > 0) {
    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
};