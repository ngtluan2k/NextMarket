import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import StoreTopBar from '../components/store/StoreTopBar';
import EveryMartHeader from '../components/Navbar';
import Footer from '../components/Footer';
import StoreBestSellers from '../components/store/StoreBestSellers';

export default function StoreLayout() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchStore = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:3000/stores/slug/${slug}`);
        setStore(res.data.data); // store object từ backend
      } catch (err) {
        console.error(err);
        // Nếu không tìm thấy store, redirect về trang 404 hoặc home
        navigate('/404');
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [slug, navigate]);

  return (
    <>
      {/* App Header */}
      <EveryMartHeader />

      {/* TopBar (card trắng bo tròn) */}
      <StoreTopBar
        storeSlug={slug}
        basePath={`/stores/slug/${slug}`}
        onSearch={(q) => navigate(`/stores/slug/${slug}`)}
        className="top-[64px]"
      />

      {/* Content — giảm khoảng cách để gần TopBar hơn */}
      <main className="mx-auto max-w-[1280px] px-3 py-2">
        {loading ? (
          <p>Đang tải cửa hàng...</p>
        ) : store ? (
          <>
            <p>{store.description}</p>
            <Outlet />
          </>
        ) : (
          <p>Không tìm thấy cửa hàng</p>
        )}
      </main>

      {/* App Footer */}
      <Footer />
    </>
  );
}
