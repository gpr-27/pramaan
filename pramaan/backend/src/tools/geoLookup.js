import axios from 'axios';

export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Pramaan-Newsroom-Verifier/1.0' },
      timeout: 8000,
    });

    const data = response.data;
    if (!data || data.error) return null;

    const addr = data.address || {};
    return {
      display_name: data.display_name,
      city: addr.city || addr.town || addr.village || addr.county || null,
      state: addr.state || null,
      country: addr.country || null,
      country_code: addr.country_code || null,
      postcode: addr.postcode || null,
      road: addr.road || null,
      suburb: addr.suburb || addr.neighbourhood || null,
    };
  } catch (err) {
    console.error('[geoLookup] Nominatim error:', err.message);
    return null;
  }
}
