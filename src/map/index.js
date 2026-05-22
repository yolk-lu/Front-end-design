/**
 * src/map/index.js
 *
 * Map 模組統一匯出入口
 *
 * 使用方式：
 *   import { searchNearbyToilets, getOSMMapUrl, getGoogleMapsUrl } from '../map';
 */

export {
  searchNearbyToilets,
  getOSMMapUrl,
  getGoogleMapsUrl,
} from './osmToiletService';
