import { useState, useEffect } from 'react';
import ProvincesService, {
  Province,
  District,
  Ward,
} from '../../../../service/provinces.service';

export const useProvinces = (version: 'v1' | 'v2' = 'v2') => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load provinces on mount and when version changes
  useEffect(() => {
    loadProvinces();
  }, [version]);

  const loadProvinces = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProvincesService.getProvinces(version);
      setProvinces(data);
    } catch (err) {
      setError('Không thể tải danh sách tỉnh/thành phố');
      console.error('Error loading provinces:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (provinceCode: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProvincesService.getDistricts(provinceCode, version);
      if (version === 'v2') {
        // V2: backend trả về danh sách phường/xã theo tỉnh (hoặc null nếu chưa hỗ trợ)
        setDistricts([]);
        setSelectedDistrict(null);
        if (Array.isArray(data)) {
          setWards(data as unknown as Ward[]);
        } else if (data && Array.isArray((data as any).wards)) {
          setWards((data as any).wards as Ward[]);
        } else if (data && Array.isArray((data as any).results)) {
          setWards((data as any).results as Ward[]);
        } else {
          setWards([]);
        }
        setSelectedWard(null);
      } else {
        setDistricts(data);
        setWards([]); // Clear wards when province changes
        setSelectedDistrict(null);
        setSelectedWard(null);
      }
    } catch (err) {
      setError('Không thể tải danh sách khu vực');
      console.error('Error loading districts/wards:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWards = async (districtCode: number) => {
    try {
      setLoading(true);
      setError(null);
      // V1: wards by district; V2: already handled in loadDistricts (by province)
      if (version === 'v1') {
        const data = await ProvincesService.getWards(districtCode, version);
        setWards(data);
      }
      setSelectedWard(null);
    } catch (err) {
      setError('Không thể tải danh sách phường/xã');
      console.error('Error loading wards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceChange = (provinceCode: number) => {
    const province = provinces.find((p) => p.code === provinceCode);
    setSelectedProvince(province || null);
    if (province) {
      loadDistricts(provinceCode);
    }
  };

  const handleDistrictChange = (districtCode: number) => {
    const district = districts.find((d) => d.code === districtCode);
    setSelectedDistrict(district || null);
    if (district && version === 'v1') loadWards(districtCode);
  };

  const handleWardChange = (wardCode: number) => {
    const ward = wards.find((w) => w.code === wardCode);
    setSelectedWard(ward || null);
  };

  const resetLocation = () => {
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
  };

  return {
    // Data
    provinces,
    districts,
    wards,
    selectedProvince,
    selectedDistrict,
    selectedWard,

    // State
    loading,
    error,

    // Actions
    handleProvinceChange,
    handleDistrictChange,
    handleWardChange,
    resetLocation,
    loadProvinces,
    isV2: version === 'v2',
  };
};
