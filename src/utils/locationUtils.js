// Haversine formula to calculate the distance between two lat/lon points
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export const findNearbyToilets = (userLat, userLon, k = 5) => {
  try {
    // 載入 JSON 資料 (依照需求，暫不優化)
    const toiletData = require('../../Datasets/Toilet_Datasets/全國公廁建檔資料.json');
    
    const distances = toiletData.map(toilet => {
      const distanceKm = getDistanceFromLatLonInKm(
        userLat,
        userLon,
        parseFloat(toilet.latitude),
        parseFloat(toilet.longitude)
      );
      return {
        ...toilet,
        distanceKm,
        distanceDisplay: distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`
      };
    });

    // 依距離排序
    distances.sort((a, b) => a.distanceKm - b.distanceKm);

    // 取前 k 個
    return distances.slice(0, k);
  } catch (error) {
    console.error('Error finding nearby toilets:', error);
    return [];
  }
};
