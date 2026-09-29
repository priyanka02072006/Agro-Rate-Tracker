import { DistrictCentroid } from '../types.js';

export const DISTRICT_CENTROIDS: DistrictCentroid[] = [
  // Tamil Nadu
  { state: 'Tamil Nadu', district: 'Krishnagiri', latitude: 12.5186, longitude: 78.2137 },
  { state: 'Tamil Nadu', district: 'Dindigul', latitude: 10.3673, longitude: 77.9803 },
  { state: 'Tamil Nadu', district: 'Salem', latitude: 11.6643, longitude: 78.146 },
  { state: 'Tamil Nadu', district: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 },
  { state: 'Tamil Nadu', district: 'Madurai', latitude: 9.9252, longitude: 78.1198 },
  { state: 'Tamil Nadu', district: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { state: 'Tamil Nadu', district: 'Thiruvallur', latitude: 13.1432, longitude: 79.9079 },
  { state: 'Tamil Nadu', district: 'Tirupur', latitude: 11.1085, longitude: 77.3411 },
  { state: 'Tamil Nadu', district: 'Erode', latitude: 11.341, longitude: 77.7172 },
  { state: 'Tamil Nadu', district: 'Tiruchirappalli', latitude: 10.7905, longitude: 78.7047 },
  { state: 'Tamil Nadu', district: 'Thanjavur', latitude: 10.787, longitude: 79.1378 },
  { state: 'Tamil Nadu', district: 'Theni', latitude: 10.0104, longitude: 77.4768 },
  { state: 'Tamil Nadu', district: 'Vellore', latitude: 12.9165, longitude: 79.1325 },
  { state: 'Tamil Nadu', district: 'Villupuram', latitude: 11.9401, longitude: 79.4861 },
  { state: 'Tamil Nadu', district: 'Tirunelveli', latitude: 8.7139, longitude: 77.7567 },

  // Maharashtra
  { state: 'Maharashtra', district: 'Nashik', latitude: 19.9975, longitude: 73.7898 },
  { state: 'Maharashtra', district: 'Pune', latitude: 18.5204, longitude: 73.8567 },
  { state: 'Maharashtra', district: 'Ahmednagar', latitude: 19.0952, longitude: 74.7496 },
  { state: 'Maharashtra', district: 'Mumbai', latitude: 19.076, longitude: 72.8777 },
  { state: 'Maharashtra', district: 'Nagpur', latitude: 21.1458, longitude: 79.0882 },
  { state: 'Maharashtra', district: 'Solapur', latitude: 17.6599, longitude: 75.9064 },
  { state: 'Maharashtra', district: 'Kolhapur', latitude: 16.705, longitude: 74.2433 },
  { state: 'Maharashtra', district: 'Aurangabad', latitude: 19.8762, longitude: 75.3433 },
  { state: 'Maharashtra', district: 'Jalgaon', latitude: 21.0077, longitude: 75.5626 },
  { state: 'Maharashtra', district: 'Satara', latitude: 17.6805, longitude: 73.9997 },
  { state: 'Maharashtra', district: 'Amravati', latitude: 20.9374, longitude: 77.7796 },

  // Karnataka
  { state: 'Karnataka', district: 'Kolar', latitude: 13.1367, longitude: 78.134 },
  { state: 'Karnataka', district: 'Bangalore Urban', latitude: 12.9716, longitude: 77.5946 },
  { state: 'Karnataka', district: 'Belagavi', latitude: 15.8497, longitude: 74.4977 },
  { state: 'Karnataka', district: 'Mysuru', latitude: 12.2958, longitude: 76.6394 },
  { state: 'Karnataka', district: 'Tumakuru', latitude: 13.3379, longitude: 77.1173 },
  { state: 'Karnataka', district: 'Shimoga', latitude: 13.9299, longitude: 75.5681 },
  { state: 'Karnataka', district: 'Chikkaballapur', latitude: 13.4355, longitude: 77.7315 },
  { state: 'Karnataka', district: 'Hubballi-Dharwad', latitude: 15.3647, longitude: 75.124 },
  { state: 'Karnataka', district: 'Haveri', latitude: 14.7954, longitude: 75.3995 },
  { state: 'Karnataka', district: 'Ballari', latitude: 15.1394, longitude: 76.9214 },

  // Uttar Pradesh
  { state: 'Uttar Pradesh', district: 'Agra', latitude: 27.1767, longitude: 78.0081 },
  { state: 'Uttar Pradesh', district: 'Kanpur', latitude: 26.4499, longitude: 80.3319 },
  { state: 'Uttar Pradesh', district: 'Lucknow', latitude: 26.8467, longitude: 80.9462 },
  { state: 'Uttar Pradesh', district: 'Varanasi', latitude: 25.3176, longitude: 82.9739 },
  { state: 'Uttar Pradesh', district: 'Meerut', latitude: 28.9845, longitude: 77.7064 },
  { state: 'Uttar Pradesh', district: 'Aligarh', latitude: 27.8974, longitude: 78.088 },
  { state: 'Uttar Pradesh', district: 'Bareilly', latitude: 28.367, longitude: 79.4304 },
  { state: 'Uttar Pradesh', district: 'Mathura', latitude: 27.4924, longitude: 77.6737 },
  { state: 'Uttar Pradesh', district: 'Saharanpur', latitude: 29.964, longitude: 77.546 },
  { state: 'Uttar Pradesh', district: 'Prayagraj', latitude: 25.4358, longitude: 81.8463 },

  // Punjab & Haryana
  { state: 'Punjab', district: 'Ludhiana', latitude: 30.901, longitude: 75.8573 },
  { state: 'Punjab', district: 'Amritsar', latitude: 31.634, longitude: 74.8723 },
  { state: 'Punjab', district: 'Jalandhar', latitude: 31.326, longitude: 75.5762 },
  { state: 'Punjab', district: 'Patiala', latitude: 30.3398, longitude: 76.3869 },
  { state: 'Punjab', district: 'Bathinda', latitude: 30.211, longitude: 74.9455 },
  { state: 'Haryana', district: 'Karnal', latitude: 29.6857, longitude: 76.9905 },
  { state: 'Haryana', district: 'Hisar', latitude: 29.1492, longitude: 75.7217 },
  { state: 'Haryana', district: 'Sirsa', latitude: 29.5349, longitude: 75.029 },
  { state: 'Haryana', district: 'Ambala', latitude: 30.3782, longitude: 76.7767 },

  // Gujarat
  { state: 'Gujarat', district: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714 },
  { state: 'Gujarat', district: 'Surat', latitude: 21.1702, longitude: 72.8311 },
  { state: 'Gujarat', district: 'Rajkot', latitude: 22.3039, longitude: 70.8022 },
  { state: 'Gujarat', district: 'Vadodara', latitude: 22.3072, longitude: 73.1812 },
  { state: 'Gujarat', district: 'Junagadh', latitude: 21.5222, longitude: 70.4579 },
  { state: 'Gujarat', district: 'Mehsana', latitude: 23.588, longitude: 72.3693 },

  // Andhra Pradesh & Telangana
  { state: 'Andhra Pradesh', district: 'Guntur', latitude: 16.3067, longitude: 80.4365 },
  { state: 'Andhra Pradesh', district: 'Kurnool', latitude: 15.8281, longitude: 78.0373 },
  { state: 'Andhra Pradesh', district: 'Visakhapatnam', latitude: 17.6868, longitude: 83.2185 },
  { state: 'Andhra Pradesh', district: 'Chittoor', latitude: 13.2172, longitude: 79.1003 },
  { state: 'Andhra Pradesh', district: 'Krishna', latitude: 16.1875, longitude: 81.1389 },
  { state: 'Telangana', district: 'Warangal', latitude: 17.9689, longitude: 79.5941 },
  { state: 'Telangana', district: 'Hyderabad', latitude: 17.385, longitude: 78.4867 },
  { state: 'Telangana', district: 'Nizamabad', latitude: 18.6725, longitude: 78.0941 },

  // Madhya Pradesh & Rajasthan
  { state: 'Madhya Pradesh', district: 'Indore', latitude: 22.7196, longitude: 75.8577 },
  { state: 'Madhya Pradesh', district: 'Bhopal', latitude: 23.2599, longitude: 77.4126 },
  { state: 'Madhya Pradesh', district: 'Ujjain', latitude: 23.1765, longitude: 75.7885 },
  { state: 'Madhya Pradesh', district: 'Jabalpur', latitude: 23.1815, longitude: 79.9864 },
  { state: 'Rajasthan', district: 'Jaipur', latitude: 26.9124, longitude: 75.7873 },
  { state: 'Rajasthan', district: 'Kota', latitude: 25.2138, longitude: 75.8648 },
  { state: 'Rajasthan', district: 'Jodhpur', latitude: 26.2389, longitude: 73.0243 },
  { state: 'Rajasthan', district: 'Alwar', latitude: 27.553, longitude: 76.6346 },

  // West Bengal & Kerala & Delhi
  { state: 'West Bengal', district: 'Kolkata', latitude: 22.5726, longitude: 88.3639 },
  { state: 'West Bengal', district: 'Hooghly', latitude: 22.9069, longitude: 88.3968 },
  { state: 'West Bengal', district: 'Burdwan', latitude: 23.2324, longitude: 87.8615 },
  { state: 'Kerala', district: 'Palakkad', latitude: 10.7867, longitude: 76.6548 },
  { state: 'Kerala', district: 'Wayanad', latitude: 11.6854, longitude: 76.132 },
  { state: 'Kerala', district: 'Ernakulam', latitude: 9.9816, longitude: 76.2999 },
  { state: 'NCT of Delhi', district: 'Delhi', latitude: 28.7041, longitude: 77.1025 },
];

export function findDistrictCentroid(state: string, district: string): { latitude: number; longitude: number } {
  const normState = state.trim().toLowerCase();
  const normDist = district.trim().toLowerCase();

  const exact = DISTRICT_CENTROIDS.find(
    (c) => c.state.toLowerCase() === normState && c.district.toLowerCase() === normDist
  );
  if (exact) return { latitude: exact.latitude, longitude: exact.longitude };

  // Fallback to district match in any state
  const distMatch = DISTRICT_CENTROIDS.find((c) => c.district.toLowerCase() === normDist);
  if (distMatch) return { latitude: distMatch.latitude, longitude: distMatch.longitude };

  // Fallback to state match
  const stateMatch = DISTRICT_CENTROIDS.find((c) => c.state.toLowerCase() === normState);
  if (stateMatch) return { latitude: stateMatch.latitude, longitude: stateMatch.longitude };

  // Default Central India coordinate
  return { latitude: 20.5937, longitude: 78.9629 };
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
