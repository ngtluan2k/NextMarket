"use client"

import { useState, useEffect } from "react"
import {
  Card,
  Button,
  Typography,
  Tag,
  Modal,
  Input,
  message,
  Spin,
  Progress,
  Row,
  Col,
  Empty,
  Space,
  InputNumber,
} from "antd"
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  GiftOutlined,
  EditOutlined,
} from "@ant-design/icons"
import { useMySubscriptions } from "../../hooks/useMySubscriptions"
import { useUseSubscription } from "../../hooks/useUseSubscription"
import AddressModal from "../AddressModal"
import type { Subscription } from "../../types/subscription"
import type { UserAddress } from "../../types/user"
import { useAuth } from "../../context/AuthContext"
import { api } from "../../api/api"
import dayjs from "dayjs"
import { useNavigate } from "react-router-dom"

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const EVERMART_PRIMARY = "#1677ff"
const CARD_SHADOW = "0 1px 2px rgba(0, 0, 0, 0.06)"
const CARD_SHADOW_HOVER = "0 4px 12px rgba(0, 0, 0, 0.1)"

export const MySubscriptionsPage = () => {
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL
  const { subscriptions, loading, error, reload } = useMySubscriptions()
  const { execute, loading: using } = useUseSubscription()
  const { me } = useAuth()
  const navigate = useNavigate()

  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null)
  const [addressModalVisible, setAddressModalVisible] = useState(false)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [note, setNote] = useState("")
  const [useQuantity, setUseQuantity] = useState(1)

  // Lấy địa chỉ mặc định từ API
  useEffect(() => {
    const fetchDefaultAddress = async () => {
      if (!me?.id) return

      try {
        const res = await api.get(`/users/${me.id}/addresses`)
        const defaultAddress = res.data.find((a: UserAddress) => a.isDefault)
        if (defaultAddress) setSelectedAddress(defaultAddress)
      } catch (err) {
        console.error("Error loading default address:", err)
        message.error("Không thể tải địa chỉ mặc định")
      }
    }

    fetchDefaultAddress()
  }, [me?.id])

  const getImageUrl = (path?: string) => {
    if (!path) return ""
    return path.startsWith("http") ? path : `${BE_BASE_URL}${path}`
  }

  const handleUseClick = (sub: Subscription) => {
    if (!selectedAddress) {
      message.warning("Vui lòng chọn địa chỉ giao hàng")
      setAddressModalVisible(true)
      return
    }
    setCurrentSubscription(sub)
    setUseQuantity(1)
    setConfirmModalVisible(true)
  }

  const handleConfirmUse = async () => {
    if (!currentSubscription || !selectedAddress) return

    setConfirmModalVisible(false)
    try {
      await execute({
        subscriptionId: currentSubscription.id,
        usedQuantity: useQuantity,
        addressId: selectedAddress.id,
        note,
      })
      message.success(`Gói "${currentSubscription.name}" đã được sử dụng thành công!`)
      setNote("")
      reload()
    } catch (err: any) {
      message.error(err?.message || "Sử dụng gói thất bại")
      console.error("Error using subscription:", err)
    }
  }

  const getStatusDisplay = (status: string) => {
    return status === "active"
      ? { icon: <CheckCircleOutlined />, color: "#52c41a", text: "Đang hoạt động" }
      : { icon: <ClockCircleOutlined />, color: "#faad14", text: "Hết hạn" }
  }

  const getProgressPercentage = (remaining: number, total: number) => {
    if (!total) return 0
    return Math.round((remaining / total) * 100)
  }

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" tip="Đang tải các gói subscription..." />
      </div>
    )

  if (error)
    return (
      <div style={{ padding: "24px" }}>
        <Text type="danger">Lỗi: {error}</Text>
      </div>
    )

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f9ff 0%, #ffffff 45%, #f9fbff 100%)",
        padding: "32px 0",
      }}
    >
      <div style={{ paddingLeft: "32px", paddingRight: "32px", marginBottom: "40px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <Title
            level={2}
            style={{
              marginBottom: "8px",
              fontWeight: 700,
              color: "#251E2A",
              fontSize: "28px",
            }}
          >
            Các gói subscription của tôi
          </Title>
          <Paragraph
            type="secondary"
            style={{ fontSize: "14px", marginBottom: 0, color: "#666" }}
          >

          </Paragraph>
        </div>
      </div>

      <div style={{ paddingLeft: "32px", paddingRight: "32px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <Row gutter={[32, 32]}>
            {/* Main Content - Subscriptions */}
            <Col xs={24} lg={16}>
              {subscriptions.length === 0 ? (
                <Card
                  style={{
                    border: "1px solid #eef1ff",
                    boxShadow: CARD_SHADOW,
                    borderRadius: "14px",
                    backgroundColor: "rgba(255,255,255,0.96)",
                  }}
                >
                  <Empty description="Chưa có gói dịch vụ" style={{ padding: "40px 0" }}>
                    <Button
                      type="primary"
                      style={{
                        backgroundColor: EVERMART_PRIMARY,
                        borderColor: EVERMART_PRIMARY,
                      }}
                      onClick={() => navigate("/subscriptions")}
                    >
                      Khám phá gói dịch vụ
                    </Button>
                  </Empty>
                </Card>
              ) : (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  {subscriptions.map((sub) => {
                    const statusDisplay = getStatusDisplay(sub.status)
                    const progressPercent = getProgressPercentage(
                      sub.remainingQuantity,
                      sub.totalQuantity,
                    )

                    return (
                      <Card
                        key={sub.id}
                        hoverable
                        style={{
                          border: "1px solid #eef1ff",
                          boxShadow: CARD_SHADOW,
                          borderRadius: "16px",
                          overflow: "hidden",
                          transition: "all 0.25s ease",
                          backgroundColor: "rgba(255,255,255,0.98)",
                        }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLDivElement).style.boxShadow = CARD_SHADOW_HOVER
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLDivElement).style.boxShadow = CARD_SHADOW
                        }}
                      >
                        <Row gutter={[24, 24]} align="middle">
                          {/* Product Image */}
                          {sub.product?.media?.[0] && (
                            <Col xs={24} sm={6}>
                              <div
                                style={{
                                  width: "100%",
                                  aspectRatio: "1 / 1",
                                  borderRadius: "8px",
                                  overflow: "hidden",
                                  backgroundColor: "#f5f5f5",
                                }}
                              >
                                <img
                                  src={getImageUrl(sub.product.media[0].url) || "/placeholder.svg"}
                                  alt={sub.product.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              </div>
                            </Col>
                          )}

                          <Col xs={24} sm={sub.product?.media?.[0] ? 18 : 24}>
                            <div>
                              {/* Header with Status */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  marginBottom: "16px",
                                  gap: "12px",
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <Title
                                    level={4}
                                    style={{
                                      marginBottom: "4px",
                                      fontWeight: 600,
                                      color: "#000",
                                    }}
                                  >
                                    {sub.name}
                                  </Title>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: "13px", color: "#999" }}
                                  >
                                    {sub.product?.name}
                                    {sub.variant?.variant_name && ` - ${sub.variant.variant_name}`}
                                  </Text>
                                </div>
                                <Tag
                                  icon={statusDisplay.icon}
                                  color={statusDisplay.color}
                                  style={{
                                    fontWeight: 500,
                                    border: "none",
                                    whiteSpace: "nowrap",
                                    borderRadius: "999px",
                                    paddingInline: 12,
                                    paddingBlock: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  {statusDisplay.text}
                                </Tag>
                              </div>

                              {/* Store Info */}
                              {sub.product?.store && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "16px",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    sub.product?.store?.slug &&
                                    navigate(`/stores/slug/${sub.product.store.slug}`)
                                  }
                                >
                                  {sub.product.store.logo_url && (
                                    <img
                                      src={
                                        getImageUrl(sub.product.store.logo_url) ||
                                        "/placeholder.svg"
                                      }
                                      alt={sub.product.store.name}
                                      style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  )}
                                  <Text style={{ fontSize: "12px", color: "#666" }}>
                                    {sub.product.store.name}
                                  </Text>
                                </div>
                              )}

                              {/* Key Metrics Grid */}
                              <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
                                <Col xs={12} sm={6}>
                                  <div>
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: "11px", color: "#999" }}
                                    >
                                      <CalendarOutlined /> Thời hạn
                                    </Text>
                                    <div style={{ marginTop: "4px" }}>
                                      <Text
                                        style={{
                                          fontSize: "12px",
                                          fontWeight: 500,
                                          color: "#333",
                                        }}
                                      >
                                        {sub.startDate
                                          ? dayjs(sub.startDate).format("DD/MM/YY")
                                          : "—"}{" "}
                                        -{" "}
                                        {sub.endDate
                                          ? dayjs(sub.endDate).format("DD/MM/YY")
                                          : "—"}
                                      </Text>
                                    </div>
                                  </div>
                                </Col>
                                <Col xs={12} sm={6}>
                                  <div>
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: "11px", color: "#999" }}
                                    >
                                      <GiftOutlined /> Chu kỳ
                                    </Text>
                                    <div style={{ marginTop: "4px" }}>
                                      <Text
                                        style={{
                                          fontSize: "12px",
                                          fontWeight: 500,
                                          color: "#333",
                                        }}
                                      >
                                        {sub.cycle} ngày
                                      </Text>
                                    </div>
                                  </div>
                                </Col>
                              </Row>

                              {/* Usage Progress */}
                              <div style={{ marginBottom: "16px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "6px",
                                  }}
                                >
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: "12px", color: "#666" }}
                                  >
                                    Số lượng còn lại
                                  </Text>
                                  <Text
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      color: EVERMART_PRIMARY,
                                    }}
                                  >
                                    {sub.remainingQuantity} / {sub.totalQuantity}
                                  </Text>
                                </div>
                                <Progress
                                  percent={progressPercent}
                                  strokeColor={EVERMART_PRIMARY}
                                  trailColor="#f0f0f0"
                                  format={(percent) => `${percent}%`}
                                  size="small"
                                />
                              </div>

                              {/* Action Button */}
                              <Button
                                type="primary"
                                size="large"
                                block
                                disabled={
                                  sub.remainingQuantity <= 0 || using || sub.status !== "active"
                                }
                                loading={using}
                                onClick={() => handleUseClick(sub)}
                                style={{
                                  fontWeight: 600,
                                  height: "40px",
                                  borderRadius: "6px",
                                  backgroundColor: EVERMART_PRIMARY,
                                  borderColor: EVERMART_PRIMARY,
                                  fontSize: "14px",
                                }}
                              >
                                <ShoppingCartOutlined /> Sử dụng gói
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    )
                  })}
                </Space>
              )}
            </Col>

            {/* Sidebar - Address */}
            <Col xs={24} lg={8}>
              <div style={{ position: "sticky", top: "24px" }}>
                <Card
                  style={{
                    border: "1px solid #eef1ff",
                    boxShadow: CARD_SHADOW,
                    borderRadius: "14px",
                    backgroundColor: "rgba(255,255,255,0.96)",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "16px",
                      paddingBottom: "12px",
                      borderBottom: "1px solid #f0f0f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Title
                      level={5}
                      style={{
                        marginBottom: 0,
                        fontWeight: 600,
                        color: "#000",
                        fontSize: "14px",
                      }}
                    >
                      <EnvironmentOutlined
                        style={{ color: EVERMART_PRIMARY, marginRight: "6px" }}
                      />
                      Giao đến
                    </Title>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setAddressModalVisible(true)}
                      style={{ padding: 0, color: EVERMART_PRIMARY, fontSize: "12px" }}
                      icon={<EditOutlined />}
                    >
                      Thay đổi
                    </Button>
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#fafafa",
                      borderRadius: "6px",
                    }}
                  >
                    {selectedAddress ? (
                      <Space direction="vertical" size={6} style={{ width: "100%" }}>
                        <div>
                          <Text
                            style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}
                          >
                            {selectedAddress.recipientName}
                          </Text>
                        </div>
                        <Text
                          type="secondary"
                          style={{ fontSize: "12px", color: "#999" }}
                        >
                          {selectedAddress.phone}
                        </Text>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: "12px",
                            display: "block",
                            color: "#999",
                            lineHeight: 1.4,
                          }}
                        >
                          {[
                            selectedAddress.street,
                            selectedAddress.ward,
                            selectedAddress.district,
                            selectedAddress.province,
                            selectedAddress.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                      </Space>
                    ) : (
                      <Text
                        type="secondary"
                        style={{ fontSize: "12px", color: "#999" }}
                      >
                        Vui lòng chọn địa chỉ giao hàng
                      </Text>
                    )}
                  </div>
                </Card>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onSelect={(addr) => setSelectedAddress(addr)}
        currentAddressId={selectedAddress?.id}
      />

      {/* Confirm use Modal */}
      <Modal
        title="Xác nhận sử dụng gói subscription"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        onOk={handleConfirmUse}
        okText="Xác nhận"
        cancelText="Hủy"
        width={700}
        bodyStyle={{ padding: "24px" }}
      >
        {currentSubscription && selectedAddress && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Row gutter={[24, 24]}>
              {currentSubscription.product?.media?.[0] && (
                <Col xs={24} sm={6}>
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      borderRadius: "8px",
                      overflow: "hidden",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    <img
                      src={
                        getImageUrl(currentSubscription.product.media[0].url) ||
                        "/placeholder.svg"
                      }
                      alt={currentSubscription.product.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </Col>
              )}
              <Col xs={24} sm={currentSubscription.product?.media?.[0] ? 18 : 24}>
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Title level={5} style={{ marginBottom: 0 }}>
                    {currentSubscription.name}
                  </Title>
                  <Text type="secondary">
                    {currentSubscription.product?.name}{" "}
                    {currentSubscription.variant?.variant_name &&
                      `(${currentSubscription.variant.variant_name})`}
                  </Text>
                  <div>
                    <Text style={{ fontSize: "13px" }}>
                      Còn lại:{" "}
                      <Text strong style={{ color: EVERMART_PRIMARY }}>
                        {currentSubscription.remainingQuantity} /{" "}
                        {currentSubscription.totalQuantity}
                      </Text>
                    </Text>
                  </div>
                </Space>
              </Col>
            </Row>

            {currentSubscription.product?.store && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px",
                  backgroundColor: "#fafafa",
                  borderRadius: "6px",
                }}
              >
                {currentSubscription.product.store.logo_url && (
                  <img
                    src={
                      getImageUrl(currentSubscription.product.store.logo_url) ||
                      "/placeholder.svg"
                    }
                    alt={currentSubscription.product.store.name}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                )}
                <Text style={{ fontSize: "12px" }}>
                  Store: {currentSubscription.product.store.name}
                </Text>
              </div>
            )}

            <div
              style={{
                padding: "12px",
                backgroundColor: "#fafafa",
                borderRadius: "6px",
              }}
            >
              <Text style={{ fontSize: "12px", fontWeight: 500 }}>
                Số lượng muốn sử dụng:
              </Text>
              <InputNumber
                min={1}
                max={currentSubscription.remainingQuantity}
                value={useQuantity}
                onChange={(value) => setUseQuantity(value || 1)}
                style={{ marginLeft: "8px", width: "80px" }}
              />
            </div>

            <div
              style={{
                padding: "12px",
                backgroundColor: "#fafafa",
                borderRadius: "6px",
              }}
            >
              <Text
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Địa chỉ giao hàng:
              </Text>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                <strong>{selectedAddress.recipientName}</strong> |{" "}
                {selectedAddress.phone}
                <br />
                {[
                  selectedAddress.street,
                  selectedAddress.ward,
                  selectedAddress.district,
                  selectedAddress.province,
                  selectedAddress.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </div>

            <div>
              <Text
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Ghi chú:
              </Text>
              <TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú (nếu có)"
                rows={3}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default MySubscriptionsPage
 