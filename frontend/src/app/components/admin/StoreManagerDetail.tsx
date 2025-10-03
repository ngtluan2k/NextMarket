import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Spin, Divider, Tag, Button, Space, Table, message, Image } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { storeService } from '../../../service/store.service';

const API_BASE_URL = 'http://localhost:3000';

// Chuẩn hoá đường dẫn ảnh: nhận full URL thì trả luôn, nhận "uploads/..." thì ghép domain,
// nhận path có backslash hoặc absolute path Windows thì cố cắt về ".../uploads/...".
function toAbs(p?: string) {
    if (!p) return '';
    let s = p.trim();
    if (/^https?:\/\//i.test(s)) return s;
    s = s.replace(/\\/g, '/');
    if (/^[a-zA-Z]:\//.test(s) || s.startsWith('file:/')) {
        const idx = s.toLowerCase().lastIndexOf('/uploads/');
        if (idx >= 0) s = s.slice(idx + 1); // 'uploads/...'
    }
    if (!/^\/?uploads\//i.test(s)) s = `uploads/${s.replace(/^\/+/, '')}`;
    return `${API_BASE_URL}/${s.replace(/^\/+/, '')}`;
}

const StoreManagerDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);


    const refresh = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await storeService.getFullStore(Number(id));
            setData(res);
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.message || 'Không tải được chi tiết cửa hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!id) return;
        try {
            setLoading(true);
            await storeService.restoreStore(Number(id));
            message.success('Khôi phục cửa hàng thành công');
            await refresh();
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.message || 'Khôi phục thất bại');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const res = await storeService.getFullStore(Number(id));
                setData(res);
            } catch (err: any) {
                console.error(err);
                message.error(err?.response?.data?.message || 'Không tải được chi tiết cửa hàng');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <div className="p-6 flex justify-center">
                <Spin size="large" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6">
                <Space direction="vertical">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                        Quay lại
                    </Button>
                    <Button type='primary' onClick={handleRestore}>Khôi phục cửa hàng</Button>
                    <div>Không có dữ liệu</div>
                </Space>
            </div>
        );
    }

    const {
        store,
        storeInformation,
        storeIdentification,
        storeLevel,
        bankAccount,
        storeAddress,
        storeEmail,
        documents,
        rating,
        followers,
    } = data;


    return (
        <div className="p-6">
            <Space className="mb-4">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                    Quay lại
                </Button>
            </Space>

            <Card title={`Cửa hàng ${store?.id} - ${store?.name ?? '-'}`}>
                <Descriptions bordered column={2} size="middle">
                    <Descriptions.Item label="ID">{store?.id}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        <Tag color={store?.status === 'active' ? 'green' : store?.status === 'suspended' ? 'red' : 'orange'}>
                            {store?.status}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">{store?.email || '-'}</Descriptions.Item>
                    <Descriptions.Item label="SĐT">{store?.phone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Slug">{store?.slug || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Followers">{followers ?? 0}</Descriptions.Item>
                    <Descriptions.Item label="Mô tả" span={2}>{store?.description || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Rating TB">{rating?.average?.toFixed?.(2) ?? 0}</Descriptions.Item>
                    <Descriptions.Item label="Số lượt đánh giá">{rating?.total ?? 0}</Descriptions.Item>
                    <Descriptions.Item label="Tạo lúc">
                        {store?.created_at ? new Date(store.created_at).toLocaleString() : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Cập nhật">
                        {store?.updated_at ? new Date(store.updated_at).toLocaleString() : '-'}
                    </Descriptions.Item>
                </Descriptions>

                <Divider />

                <Descriptions title="Thông tin pháp lý" bordered column={2} size="small">
                    <Descriptions.Item label="Loại">{storeInformation?.type || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Tên pháp lý">{storeInformation?.name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="MST">{storeInformation?.tax_code || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Email liên hệ">{storeEmail?.email || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ" span={2}>{storeInformation?.addresses || '-'}</Descriptions.Item>
                </Descriptions>

                <Divider />

                <Descriptions title="Định danh" bordered column={2} size="small">
                    <Descriptions.Item label="Họ tên">{storeIdentification?.full_name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Loại">{storeIdentification?.type || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Ảnh trước">
                        {storeIdentification?.img_front ? (
                            <Image width={200} src={toAbs(storeIdentification.img_front)} />
                        ) : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ảnh sau">
                        {storeIdentification?.img_back ? (
                            <Image width={200} src={toAbs(storeIdentification.img_back)} />
                        ) : '-'}
                    </Descriptions.Item>
                </Descriptions>

                <Divider />

                <Descriptions title="Cấp cửa hàng" bordered column={2} size="small">
                    <Descriptions.Item label="Level">{storeLevel?.level || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Nâng cấp lúc">
                        {storeLevel?.upgraded_at ? new Date(storeLevel.upgraded_at).toLocaleString() : '-'}
                    </Descriptions.Item>
                </Descriptions>

                <Divider />

                <Descriptions title="Địa chỉ" bordered column={2} size="small">
                    <Descriptions.Item label="Người nhận">{storeAddress?.recipient_name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="SĐT">{storeAddress?.phone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Đường">{storeAddress?.street || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Phường Xã">{storeAddress?.ward || '-'}</Descriptions.Item>
                    {storeAddress?.district?.toString().trim() && (
                        <Descriptions.Item label="Huyện/Xã">
                            {storeAddress.district}
                        </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Tỉnh/TP">{storeAddress?.province || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Quốc gia">{storeAddress?.country || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Mã bưu chính">{storeAddress?.postal_code || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Chi tiết" span={2}>{storeAddress?.detail || '-'}</Descriptions.Item>
                </Descriptions>

                <Divider />

                <Descriptions title="Tài khoản ngân hàng" bordered column={2} size="small">
                    <Descriptions.Item label="Ngân hàng">{bankAccount?.bank_name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Chủ TK">{bankAccount?.account_holder || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Số TK" span={2}>{bankAccount?.account_number || '-'}</Descriptions.Item>
                </Descriptions>

                <Divider />

                <Descriptions title="Tài liệu" bordered column={1} size="small">
                    <Descriptions.Item label="Danh sách">
                        {documents ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <Image
                                    width={140}
                                    height={90}
                                    src={toAbs(documents.file_url)}
                                    style={{
                                        objectFit: 'contain',
                                        background: '#fafafa',
                                        border: '1px solid #eee',
                                        borderRadius: 4,
                                    }}
                                    onError={(e) => {
                                        const el = e.currentTarget as HTMLImageElement;
                                        el.onerror = null;
                                        el.src = toAbs('/uploads/documents/' + documents.file_url.split('/').pop());
                                    }}
                                />
                            </div>
                        ) : (
                            '-'
                        )}
                    </Descriptions.Item>
                </Descriptions>
            </Card>
        </div>
    );
};

export default StoreManagerDetail;