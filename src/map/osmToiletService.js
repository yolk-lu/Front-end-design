/**
 * src/map/osmToiletService.js
 *
 * 使用 OpenStreetMap Overpass API 查詢附近公廁資料。
 * Overpass API 是免費、無需金鑰的 OSM 查詢服務。
 *
 * 主要匯出函式：
 *   - searchNearbyToilets(latitude, longitude, radiusMeters)
 *   - getOSMMapUrl(latitude, longitude, zoom)
 */

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Haversine 公式：計算兩點間的距離（公里）
 */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 格式化距離為人類可讀字串
 */
function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/**
 * 向 Overpass API 查詢附近公廁
 *
 * @param {number} latitude   使用者緯度
 * @param {number} longitude  使用者經度
 * @param {number} radiusMeters 搜尋半徑（公尺），預設 1000m
 * @param {number} limit      最多回傳幾筆，預設 10
 * @returns {Promise<Array>}  廁所資料陣列
 *
 * 回傳格式：
 * [
 *   {
 *     id: string,
 *     name: string,
 *     latitude: number,
 *     longitude: number,
 *     distanceKm: number,
 *     distanceDisplay: string,
 *     address: string,
 *     opening_hours: string | null,
 *     wheelchair: string | null,
 *     fee: string | null,
 *   }
 * ]
 */
export async function searchNearbyToilets(
  latitude,
  longitude,
  radiusMeters = 1000,
  limit = 10,
) {
  // Overpass QL 查詢語句：搜尋半徑內所有標記為 toilet 的節點與路段
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="toilets"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="toilets"](around:${radiusMeters},${latitude},${longitude});
    );
    out center body;
  `;

  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API 回應錯誤：${response.status}`);
  }

  const json = await response.json();

  // 將原始 OSM 元素轉換成統一格式
  const results = json.elements
    .map((element) => {
      // way 元素沒有直接的 lat/lon，改用 center
      const lat =
        element.type === 'way' ? element.center?.lat : element.lat;
      const lon =
        element.type === 'way' ? element.center?.lon : element.lon;

      if (!lat || !lon) return null;

      const distanceKm = getDistanceKm(latitude, longitude, lat, lon);
      const tags = element.tags || {};

      return {
        id: `${element.type}/${element.id}`,
        name: tags.name || tags['name:zh'] || '公廁',
        latitude: lat,
        longitude: lon,
        distanceKm,
        distanceDisplay: formatDistance(distanceKm),
        address: tags['addr:full'] || tags['addr:street'] || '',
        opening_hours: tags.opening_hours || null,
        wheelchair: tags.wheelchair || null,   // 'yes' | 'no' | 'limited'
        fee: tags.fee || null,                 // 'yes' | 'no'
      };
    })
    .filter(Boolean) // 移除無效項目
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return results;
}

/**
 * 產生 OpenStreetMap 地圖連結（在瀏覽器或 WebView 中開啟）
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} zoom  縮放等級 1~19，預設 17
 * @returns {string} OSM 地圖網址
 */
export function getOSMMapUrl(latitude, longitude, zoom = 17) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`;
}

/**
 * 產生 Google Maps 導航連結（備用，與現有功能一致）
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string} Google Maps 網址
 */
export function getGoogleMapsUrl(latitude, longitude) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
