import { Outlet, useNavigate, useParams } from "react-router-dom";
import StoreTopBar from "../components/store/StoreTopBar";
import EveryMartHeader from "../components/Navbar";
import Footer from "../components/Footer";

export default function StoreLayout() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();

  return (
    <>
      {/* App Header */}
      <EveryMartHeader />

      {/* Store Top Bar
          - Nếu Header của bạn sticky cao ~56–64px, thêm className "top-[64px]" để tránh đè.
          - Nếu Header KHÔNG sticky, có thể bỏ className này. */}
      <StoreTopBar
        storeSlug={slug}
        basePath={`/store/${slug}`}
        onSearch={(q) =>
          navigate(`/store/${slug}/all?q=${encodeURIComponent(q)}`)
        }
        className="top-[64px]"   // 👈 chỉnh theo chiều cao thực tế của Header (56/64/72px…)
      />

      {/* Content */}
      <main className="mx-auto max-w-[1200px] px-4 py-6">
        <Outlet />
      </main>

      {/* App Footer */}
      <Footer />
    </>
  );
}