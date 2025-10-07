import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  BankOutlined,
  FileTextOutlined,
  StarFilled,
  NumberOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { message, Modal  } from "antd";
import { storeService } from "../../../service/store.service";
import AdminHeader from "./AdminHeader";

const API_BASE_URL = "http://localhost:3000";

/** Chuẩn hoá URL ảnh */
function toAbs(p?: string | null): string {
  if (!p) return "";
  let s = String(p).trim();
  if (/^https?:\/\//i.test(s)) return s;
  s = s.replace(/\\/g, "/");
  if (/^[a-zA-Z]:\//.test(s) || s.startsWith("file:/")) {
    const idx = s.toLowerCase().lastIndexOf("/uploads/");
    if (idx >= 0) s = s.slice(idx + 1);
  }
  if (!/^\/?uploads\//i.test(s)) s = `uploads/${s.replace(/^\/+/, "")}`;
  return `${API_BASE_URL}/${s.replace(/^\/+/, "")}`;
}
const fmtDate = (v?: string | number | Date | null) =>
  v ? new Date(v).toLocaleString() : "-";

/** Chip nhỏ */
function Chip({
  color = "gray",
  children,
}: {
  color?: "green" | "red" | "gold" | "gray" | "blue";
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    green: "bg-green-50 text-green-700 ring-green-600/20",
    red: "bg-red-50 text-red-700 ring-red-600/20",
    gold: "bg-amber-50 text-amber-700 ring-amber-600/20",
    gray: "bg-gray-100 text-gray-700 ring-gray-600/20",
    blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
        colorMap[color] || colorMap.gray
      }`}
    >
      {children}
    </span>
  );
}

/** 🔎 Chỉ tô đỏ khi thật sự đã xoá */
const statusToColor = (
  s?: string | null
): "green" | "red" | "gold" | "gray" => {
  const x = (s || "").toLowerCase();
  if (x === "active") return "green";
  if (x === "deleted") return "red"; // chỉ đỏ khi deleted
  if (x) return "gold";
  return "gray";
};

/** Helper nhận biết các cờ 'đã xoá' phổ biến */
const isTruthy = (v: any) =>
  v === true ||
  v === "true" ||
  (typeof v === "string" && v.trim().length > 0) ||
  (typeof v === "number" && !Number.isNaN(v));

  const deriveCanRestore = (res: any) => {
    const st = String(res?.store?.status || "").toLowerCase();
    return st === "deleted";
  };

const StoreManagerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [canRestore, setCanRestore] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setCanRestore(false);
      const res = await storeService.getFullStore(Number(id));
      setData(res);

      // ✅ Chỉ bật khôi phục khi thật sự đã xoá
      setCanRestore(deriveCanRestore(res));
    } catch (err: any) {
      // ✅ Nếu API trả 404/410 hoặc thông báo có 'deleted' => coi như đã xoá (ẩn record)
      const code = err?.response?.status;
      const msg = String(
        err?.response?.data?.message || err?.message || ""
      ).toLowerCase();
      const deletedFromHttp =
        code === 404 || code === 410 || msg.includes("deleted");
      setCanRestore(deletedFromHttp);

      setData(null);
      console.error(err);
      message.error(
        err?.response?.data?.message || "Không tải được chi tiết cửa hàng"
      );
    } finally {
      setLoading(false);
    }
  };

  const restore = async () => {
    if (!id) return;
    try {
      setLoading(true);
      await storeService.restoreStore(Number(id));
      message.success("Khôi phục cửa hàng thành công");
      await load();
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || "Khôi phục thất bại");
    } finally {
      setLoading(false);
    }
  };

  const confirmRestore = () => {
    Modal.confirm({
      title: "Khôi phục cửa hàng?",
      content: "Bạn có chắc chắn muốn khôi phục cửa hàng này không?",
      okText: "Khôi phục",
      cancelText: "Huỷ",
      icon: <SafetyCertificateOutlined style={{ color: "#1677ff" }} />,
      onOk: () => restore(),
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const store = data?.store;
  const storeInformation = data?.storeInformation;
  const storeIdentification = data?.storeIdentification;
  const storeLevel = data?.storeLevel;
  const bankAccount = data?.bankAccount;
  const storeAddress = data?.storeAddress;
  const storeEmail = data?.storeEmail;
  const documents = data?.documents;
  const rating = data?.rating;
  const followers = data?.followers;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header admin giữ nguyên */}
      <AdminHeader />

      {/* Thanh công cụ trang */}
      <div className="mx-auto max-w-6xl px-6 pt-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-100"
            >
              <ArrowLeftOutlined /> Quay lại
            </button>
            <div className="text-base sm:text-lg font-semibold text-gray-900">
              {`Cửa hàng ${store?.id ?? ""} - ${store?.name ?? "-"}`}{" "}
              {store?.status && (
                <span className="ml-2 align-middle">
                  <Chip color={statusToColor(store?.status)}>
                    {store?.status}
                  </Chip>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-100"
              disabled={loading}
            >
              <ReloadOutlined className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && !data ? (
        <div className="min-h-[50vh] grid place-items-center">
          <div className="flex items-center gap-2 text-gray-600">
            <ReloadOutlined className="animate-spin" />
            Đang tải dữ liệu…
          </div>
        </div>
      ) : null}

      {/* Empty state: vẫn cho khôi phục nếu record đã xoá và API trả 404/410 */}
      {!loading && !data && (
        <div className="mx-auto max-w-6xl p-6">
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
            <p className="mb-4">Không có dữ liệu cửa hàng.</p>
            {canRestore && (
              <button
                onClick={confirmRestore}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <SafetyCertificateOutlined />
                Khôi phục cửa hàng
              </button>
            )}
          </div>
        </div>
      )}

      {/* Nội dung khi có data */}
      {data && (
        <div className="mx-auto max-w-6xl p-6">
          {/* Title card */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <ShoppingOutlined />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {store?.name || "-"}{" "}
                    <span className="ml-2 align-middle">
                      <Chip color={statusToColor(store?.status)}>
                        {store?.status || "-"}
                      </Chip>
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    ID: {store?.id} • Slug: {store?.slug || "-"}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-sm text-amber-600">
                    <StarFilled />
                    <span>Rating TB</span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {(rating?.average ?? 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Số lượt đánh giá</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {rating?.total ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Followers</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {followers ?? 0}
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-gray-700">{store?.description ?? "-"}</p>
          </div>

          {/* Grid sections */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Contact & meta */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-gray-900">
                <UserOutlined />
                <span className="font-semibold">Liên hệ</span>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <MailOutlined className="text-gray-500" /> {store?.email || "-"}
                </div>
                <div className="flex items-center gap-2">
                  <PhoneOutlined className="text-gray-500" /> {store?.phone || "-"}
                </div>
                <div className="flex items-center gap-2">
                  <TagsOutlined className="text-gray-500" /> Slug: {store?.slug || "-"}
                </div>
                <div className="flex items-center gap-2">
                  <NumberOutlined className="text-gray-500" /> ID: {store?.id}
                </div>
                <div className="flex items-center gap-2">
                  <FileTextOutlined className="text-gray-500" /> Tạo: {fmtDate(store?.created_at)}
                </div>
                <div className="flex items-center gap-2">
                  <ReloadOutlined className="text-gray-500" /> Cập nhật: {fmtDate(store?.updated_at)}
                </div>
              </div>
            </section>

            {/* Legal */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-gray-900">
                <SafetyCertificateOutlined />
                <span className="font-semibold">Thông tin pháp lý</span>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
                <div>
                  Loại: <span className="font-medium text-gray-900">{storeInformation?.type || "-"}</span>
                </div>
                <div>
                  Tên pháp lý: <span className="font-medium text-gray-900">{storeInformation?.name || "-"}</span>
                </div>
                <div>
                  MST: <span className="font-medium text-gray-900">{storeInformation?.tax_code || "-"}</span>
                </div>
                <div>
                  Email liên hệ: <span className="font-medium text-gray-900">{storeEmail?.email || "-"}</span>
                </div>
                <div className="sm:col-span-2">
                  Địa chỉ: <span className="font-medium text-gray-900">{storeInformation?.addresses || "-"}</span>
                </div>
              </div>
            </section>

            {/* Identity */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-gray-900">
                <IdcardOutlined />
                <span className="font-semibold">Định danh</span>
              </div>
              <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 sm:grid-cols-2">
                <div>
                  Họ tên: <span className="font-medium text-gray-900">{storeIdentification?.full_name || "-"}</span>
                </div>
                <div>
                  Loại: <span className="font-medium text-gray-900">{storeIdentification?.type || "-"}</span>
                </div>
                <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                  <figure>
                    <figcaption className="mb-1 text-xs text-gray-500">Ảnh trước</figcaption>
                    {storeIdentification?.img_front ? (
                      <img className="h-40 w-full rounded-lg border object-contain" src={toAbs(storeIdentification.img_front)} alt="front" />
                    ) : (
                      <div className="grid h-40 place-items-center rounded-lg border text-gray-400">-</div>
                    )}
                  </figure>
                  <figure>
                    <figcaption className="mb-1 text-xs text-gray-500">Ảnh sau</figcaption>
                    {storeIdentification?.img_back ? (
                      <img className="h-40 w-full rounded-lg border object-contain" src={toAbs(storeIdentification.img_back)} alt="back" />
                    ) : (
                      <div className="grid h-40 place-items-center rounded-lg border text-gray-400">-</div>
                    )}
                  </figure>
                </div>
              </div>
            </section>

            {/* Address */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-gray-900">
                <EnvironmentOutlined />
                <span className="font-semibold">Địa chỉ</span>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
                <div>
                  Người nhận: <span className="font-medium text-gray-900">{storeAddress?.recipient_name || "-"}</span>
                </div>
                <div>
                  SĐT: <span className="font-medium text-gray-900">{storeAddress?.phone || "-"}</span>
                </div>
                <div>
                  Đường: <span className="font-medium text-gray-900">{storeAddress?.street || "-"}</span>
                </div>
                <div>
                  Phường/Xã: <span className="font-medium text-gray-900">{storeAddress?.ward || "-"}</span>
                </div>
                {storeAddress?.district && (
                  <div>
                    Quận/Huyện: <span className="font-medium text-gray-900">{storeAddress?.district}</span>
                  </div>
                )}
                <div>
                  Tỉnh/TP: <span className="font-medium text-gray-900">{storeAddress?.province || "-"}</span>
                </div>
                <div>
                  Quốc gia: <span className="font-medium text-gray-900">{storeAddress?.country || "-"}</span>
                </div>
                <div>
                  Mã bưu chính: <span className="font-medium text-gray-900">{storeAddress?.postal_code || "-"}</span>
                </div>
                <div className="sm:col-span-2">
                  Chi tiết: <span className="font-medium text-gray-900">{storeAddress?.detail || "-"}</span>
                </div>
              </div>
            </section>

            {/* Level */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-gray-900">
                <ShoppingOutlined />
                <span className="font-semibold">Cấp cửa hàng</span>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
                <div>
                  Level: <span className="font-medium text-gray-900">{storeLevel?.level || "-"}</span>
                </div>
                <div>
                  Nâng cấp lúc: <span className="font-medium text-gray-900">{fmtDate(storeLevel?.upgraded_at)}</span>
                </div>
              </div>
            </section>

            {/* Bank */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-gray-900">
                <BankOutlined />
                <span className="font-semibold">Tài khoản ngân hàng</span>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
                <div>
                  Ngân hàng: <span className="font-medium text-gray-900">{bankAccount?.bank_name || "-"}</span>
                </div>
                <div>
                  Chủ TK: <span className="font-medium text-gray-900">{bankAccount?.account_holder || "-"}</span>
                </div>
                <div className="sm:col-span-2">
                  Số TK: <span className="font-mono font-medium text-gray-900">{bankAccount?.account_number || "-"}</span>
                </div>
              </div>
            </section>

            {/* Documents */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-gray-900">
                <FileTextOutlined />
                <span className="font-semibold">Tài liệu</span>
              </div>
              {documents?.file_url ? (
                <img
                  className="h-28 w-44 rounded-lg border object-contain bg-gray-50"
                  src={toAbs(documents.file_url)}
                  alt="document"
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    el.onerror = null;
                    const name = String(documents.file_url).split("/").pop();
                    el.src = toAbs(`/uploads/documents/${name}`);
                  }}
                />
              ) : (
                <div className="text-sm text-gray-500">-</div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreManagerDetail;
