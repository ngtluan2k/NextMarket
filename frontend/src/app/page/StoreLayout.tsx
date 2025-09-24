import { Outlet, useNavigate, useParams } from "react-router-dom";
import StoreTopBar from "../components/store/StoreTopBar";
import EveryMartHeader from "../components/Navbar";
import Footer from "../components/Footer";
import StoreBestSellers from "../components/store/StoreBestSellers";

export default function StoreLayout() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();

  return (
    <>
      {/* App Header */}
      <EveryMartHeader />

      {/* TopBar (card trắng bo tròn) */}
      <StoreTopBar
        storeSlug={slug}
        basePath={`/store/${slug}`}
        onSearch={(q) => navigate(`/store/${slug}/all?q=${encodeURIComponent(q)}`)}
        className="top-[64px]"
      />

      {/* Content — giảm khoảng cách để gần TopBar hơn */}
      <main className="mx-auto max-w-[1280px] px-3 py-2">
        <Outlet />
      </main>

      {/* App Footer */}
      <Footer />
    </>
  );
}
