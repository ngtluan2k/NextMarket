'use client';
import React, { useEffect, useState } from 'react';
import {
    Card,
    Descriptions,
    Spin,
    Divider,
    Tag,
    Button,
    Space,
    message,
    Image,
    Form,
    Input,
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { storeService } from '../../../../service/store.service';

const API_BASE_URL = 'http://localhost:3000';

function toAbs(p?: string) {
    if (!p) return '';
    let s = p.trim();
    if (/^https?:\/\//i.test(s)) return s;
    s = s.replace(/\\/g, '/');
    if (/^[a-zA-Z]:\//.test(s) || s.startsWith('file:/')) {
        const idx = s.toLowerCase().lastIndexOf('/uploads/');
        if (idx >= 0) s = s.slice(idx + 1);
    }
    if (!/^\/?uploads\//i.test(s)) s = `uploads/${s.replace(/^\/+/, '')}`;
    return `${API_BASE_URL}/${s.replace(/^\/+/, '')}`;
}

export default function StoreInfoTab() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    // Edit modes
    const [storeEdit, setStoreEdit] = useState(false);
    const [bizEdit, setBizEdit] = useState(false);
    const [idenEdit, setIdenEdit] = useState(false);
    const [addrEdit, setAddrEdit] = useState(false);
    const [bankEdit, setBankEdit] = useState(false);

    // Forms
    const [storeForm] = Form.useForm();
    const [bizForm] = Form.useForm();
    const [idenForm] = Form.useForm();
    const [addrForm] = Form.useForm();
    const [bankForm] = Form.useForm();

    const refresh = async () => {
        try {
            setLoading(true);
            const my = await storeService.getMyStore();
            if (my?.id) {
                const res = await storeService.getFullStore(my.id);
                setData(res);
            } else {
                message.error('Bạn chưa có cửa hàng. Vui lòng đăng ký.');
            }
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.message || 'Không tải được thông tin cửa hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

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
                <div>Không có dữ liệu cửa hàng</div>
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

    // --------- Store basic info (inline) ----------
    const startStoreEdit = () => {
        storeForm.setFieldsValue({
            name: store?.name,
            slug: store?.slug,
            logo_url: store?.logo_url,
            description: store?.description,
            email: store?.email,
            phone: store?.phone,
        });
        setStoreEdit(true);
    };

    const saveStore = async () => {
        try {
            const v = await storeForm.validateFields();
            const payload = {
                name: v.name,
                slug: v.slug,
                description: v.description,
                logo_url: v.logo_url,
            };
            await storeService.updateStore(store.id, payload);
            message.success('Cập nhật cửa hàng thành công');
            setStoreEdit(false);
            await refresh();
        } catch (e: any) {
            message.error(e?.response?.data?.message || 'Cập nhật thất bại');
        }
    };

    // --------- Business info (inline) ----------
    const startBizEdit = () => {
        bizForm.setFieldsValue({
            type: storeInformation?.type,
            name: storeInformation?.name,
            tax_code: storeInformation?.tax_code,
            email: storeEmail?.email,
            addresses: storeInformation?.addresses,
        });
        setBizEdit(true);
    };

    const saveBiz = async () => {
        try {
            const v = await bizForm.validateFields();
            await storeService.updateComprehensive({
                store_id: store.id,
                store_information: {
                    type: v.type,
                    name: v.name,
                    tax_code: v.tax_code,
                    addresses: v.addresses,
                },
                store_information_email: v.email ? { email: v.email } : undefined,
            });
            message.success('Cập nhật thông tin pháp lý thành công');
            setBizEdit(false);
            await refresh();
        } catch (e: any) {
            message.error(e?.response?.data?.message || 'Cập nhật thất bại');
        }
    };

    // --------- Identification (inline) ----------
    const startIdenEdit = () => {
        idenForm.setFieldsValue({
            type: storeIdentification?.type,
            full_name: storeIdentification?.full_name,
            img_front: storeIdentification?.img_front,
            img_back: storeIdentification?.img_back,
        });
        setIdenEdit(true);
    };

    const saveIden = async () => {
        try {
            const v = await idenForm.validateFields();
            await storeService.updateComprehensive({
                store_id: store.id,
                store_identification: {
                    type: v.type,
                    full_name: v.full_name,
                    img_front: v.img_front,
                    img_back: v.img_back,
                },
            });
            message.success('Cập nhật định danh thành công');
            setIdenEdit(false);
            await refresh();
        } catch (e: any) {
            message.error(e?.response?.data?.message || 'Cập nhật thất bại');
        }
    };

    // --------- Address (inline) ----------
    const startAddrEdit = () => {
        addrForm.setFieldsValue({
            recipient_name: storeAddress?.recipient_name,
            phone: storeAddress?.phone,
            street: storeAddress?.street,
            ward: storeAddress?.ward,
            district: storeAddress?.district,
            province: storeAddress?.province,
            country: storeAddress?.country,
            postal_code: storeAddress?.postal_code,
            type: storeAddress?.type || 'warehouse',
            detail: storeAddress?.detail,
        });
        setAddrEdit(true);
    };

    const saveAddr = async () => {
        try {
            const v = await addrForm.validateFields();
            await storeService.updateComprehensive({
                store_id: store.id,
                store_address: {
                    recipient_name: v.recipient_name,
                    phone: v.phone,
                    street: v.street,
                    ward: v.ward,
                    district: v.district,
                    province: v.province,
                    country: v.country,
                    postal_code: v.postal_code,
                    type: v.type || 'warehouse',
                    detail: v.detail,
                },
            });
            message.success('Cập nhật địa chỉ thành công');
            setAddrEdit(false);
            await refresh();
        } catch (e: any) {
            message.error(e?.response?.data?.message || 'Cập nhật thất bại');
        }
    };

    // --------- Bank account (inline) ----------
    const startBankEdit = () => {
        bankForm.setFieldsValue({
            bank_name: bankAccount?.bank_name,
            account_holder: bankAccount?.account_holder,
            account_number: bankAccount?.account_number,
        });
        setBankEdit(true);
    };

    const saveBank = async () => {
        try {
            const v = await bankForm.validateFields();
            await storeService.updateComprehensive({
                store_id: store.id,
                bank_account: {
                    bank_name: v.bank_name,
                    account_holder: v.account_holder,
                    account_number: v.account_number,
                },
            });
            message.success('Cập nhật tài khoản ngân hàng thành công');
            setBankEdit(false);
            await refresh();
        } catch (e: any) {
            message.error(e?.response?.data?.message || 'Cập nhật thất bại');
        }
    };

    return (
        <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Thông tin cửa hàng</h2>
                {!storeEdit ? (
                    <Button type="primary" icon={<EditOutlined />} onClick={startStoreEdit}>
                        Chỉnh sửa
                    </Button>
                ) : (
                    <Space>
                        <Button onClick={() => setStoreEdit(false)}>Hủy</Button>
                        <Button type="primary" className="bg-cyan-500 border-cyan-500" onClick={saveStore}>
                            Lưu
                        </Button>
                    </Space>
                )}
            </div>

            <Card title={`Cửa hàng ${store?.id} - ${store?.name ?? '-'}`}>
                {!storeEdit ? (
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
                ) : (
                    <Form form={storeForm} layout="vertical">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item name="name" label="Tên cửa hàng" rules={[{ required: true, message: 'Nhập tên' }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="slug" label="Slug" rules={[{ required: true, message: 'Nhập slug' }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="email" label="Email">
                                <Input type="email" disabled />
                            </Form.Item>
                            <Form.Item name="phone" label="SĐT">
                                <Input disabled />
                            </Form.Item>
                            <Form.Item name="logo_url" label="Logo URL">
                                <Input />
                            </Form.Item>
                            <Form.Item className="md:col-span-2" name="description" label="Mô tả">
                                <Input.TextArea rows={3} />
                            </Form.Item>
                        </div>
                    </Form>
                )}

                <Divider />

                {/* Business info */}
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-semibold">Thông tin pháp lý</h4>
                    {!bizEdit ? (
                        <Button type="primary" icon={<EditOutlined />}>Sửa</Button>
                    ) : (
                        <Space>
                            <Button size="small" onClick={() => setBizEdit(false)}>Hủy</Button>
                            <Button size="small" type="primary" onClick={saveBiz}>Lưu</Button>
                        </Space>
                    )}
                </div>
                {!bizEdit ? (
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Loại">{storeInformation?.type || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Tên pháp lý">{storeInformation?.name || '-'}</Descriptions.Item>
                        <Descriptions.Item label="MST">{storeInformation?.tax_code || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Email liên hệ">{storeEmail?.email || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ" span={2}>{storeInformation?.addresses || '-'}</Descriptions.Item>
                    </Descriptions>
                ) : (
                    <Form form={bizForm} layout="vertical">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item name="type" label="Loại"><Input /></Form.Item>
                            <Form.Item name="name" label="Tên pháp lý" rules={[{ required: true, message: 'Nhập tên' }]}><Input /></Form.Item>
                            <Form.Item name="tax_code" label="MST"><Input /></Form.Item>
                            <Form.Item name="email" label="Email liên hệ"><Input type="email" /></Form.Item>
                            <Form.Item className="md:col-span-2" name="addresses" label="Địa chỉ">
                                <Input.TextArea rows={2} />
                            </Form.Item>
                        </div>
                    </Form>
                )}

                <Divider />

                {/* Identification */}
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-semibold">Định danh</h4>
                    {!idenEdit ? (
                        <Button type="primary" icon={<EditOutlined />}>Sửa</Button>
                    ) : (
                        <Space>
                            <Button size="small" onClick={() => setIdenEdit(false)}>Hủy</Button>
                            <Button size="small" type="primary" onClick={saveIden}>Lưu</Button>
                        </Space>
                    )}
                </div>
                {!idenEdit ? (
                    <Descriptions bordered column={2} size="small">
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
                ) : (
                    <Form form={idenForm} layout="vertical">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item name="full_name" label="Họ tên"><Input /></Form.Item>
                            <Form.Item name="type" label="Loại"><Input /></Form.Item>
                            <Form.Item name="img_front" label="URL ảnh trước"><Input /></Form.Item>
                            <Form.Item name="img_back" label="URL ảnh sau"><Input /></Form.Item>
                        </div>
                    </Form>
                )}

                <Divider />

                {/* Address */}
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-semibold">Địa chỉ</h4>
                    {!addrEdit ? (
                        <Button type="primary" icon={<EditOutlined />}>Sửa</Button>
                    ) : (
                        <Space>
                            <Button size="small" onClick={() => setAddrEdit(false)}>Hủy</Button>
                            <Button size="small" type="primary" onClick={saveAddr}>Lưu</Button>
                        </Space>
                    )}
                </div>
                {!addrEdit ? (
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Người nhận">{storeAddress?.recipient_name || '-'}</Descriptions.Item>
                        <Descriptions.Item label="SĐT">{storeAddress?.phone || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Đường">{storeAddress?.street || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Phường/Xã">{storeAddress?.ward || '-'}</Descriptions.Item>
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
                ) : (
                    <Form form={addrForm} layout="vertical">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item name="recipient_name" label="Người nhận"><Input /></Form.Item>
                            <Form.Item name="phone" label="SĐT"><Input /></Form.Item>
                            <Form.Item name="street" label="Đường"><Input /></Form.Item>
                            <Form.Item name="ward" label="Phường/Xã"><Input /></Form.Item>
                            <Form.Item name="district" label="Huyện/Xã"><Input /></Form.Item>
                            <Form.Item name="province" label="Tỉnh/TP"><Input /></Form.Item>
                            <Form.Item name="country" label="Quốc gia"><Input /></Form.Item>
                            <Form.Item name="postal_code" label="Mã bưu chính"><Input /></Form.Item>
                            <Form.Item name="type" label="Loại địa chỉ" rules={[{ required: true, message: 'Nhập loại (vd: warehouse)' }]}>
                                <Input placeholder="warehouse" />
                            </Form.Item>
                            <Form.Item className="md:col-span-2" name="detail" label="Chi tiết">
                                <Input.TextArea rows={2} />
                            </Form.Item>
                        </div>
                    </Form>
                )}

                <Divider />

                {/* Bank account */}
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-semibold">Tài khoản ngân hàng</h4>
                    {!bankEdit ? (
                        <Button type="primary" icon={<EditOutlined />}>Sửa</Button>
                    ) : (
                        <Space>
                            <Button size="small" onClick={() => setBankEdit(false)}>Hủy</Button>
                            <Button size="small" type="primary" onClick={saveBank}>Lưu</Button>
                        </Space>
                    )}
                </div>
                {!bankEdit ? (
                    <Descriptions title="" bordered column={2} size="small">
                        <Descriptions.Item label="Ngân hàng">{bankAccount?.bank_name || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Chủ TK">{bankAccount?.account_holder || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Số TK" span={2}>{bankAccount?.account_number || '-'}</Descriptions.Item>
                    </Descriptions>
                ) : (
                    <Form form={bankForm} layout="vertical">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item name="bank_name" label="Ngân hàng"><Input /></Form.Item>
                            <Form.Item name="account_holder" label="Chủ TK"><Input /></Form.Item>
                            <Form.Item className="md:col-span-2" name="account_number" label="Số TK"><Input /></Form.Item>
                        </div>
                    </Form>
                )}

                <Divider />

                <Descriptions title="Tài liệu" bordered column={1} size="small">
                    <Descriptions.Item label="Danh sách">
                        {documents ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <Image
                                    width={140}
                                    height={90}
                                    src={toAbs(documents.file_url)}
                                    style={{ objectFit: 'contain', background: '#fafafa', border: '1px solid #eee', borderRadius: 4 }}
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
}