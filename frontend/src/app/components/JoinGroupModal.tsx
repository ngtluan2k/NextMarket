import React from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '../hooks/useAuth'; 
import { groupOrdersApi } from './../../service/groupOrderItems.service';

type JoinGroupModalProps = {
  open: boolean;
  onClose: () => void;
};

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ open, onClose }) => {
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msgApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { user } = useAuth(); // user.user_id || user.id

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = code.trim();
    if (!raw) return;

    const uid = user?.user_id ?? user?.id;
    if (uid == null) {
      msgApi.warning('Vui lòng đăng nhập trước khi tham gia nhóm.');
      return;
    }

    // Phân loại input: UUID/link hoặc join_code 6 ký tự
    const uuidFromLink = raw.match(/([0-9a-fA-F-]{36})/)?.[1];
    const isUuid = uuidFromLink ? true : /^[0-9a-fA-F-]{36}$/.test(raw);
    const isJoinCode = /^[A-Z0-9]{6}$/.test(raw.toUpperCase());

    setLoading(true);
    try {
      // 1) Link/UUID → điều hướng sang /group/:uuid (GroupJoin.tsx tự joinByUuid)
      if (isUuid) {
        const uuid = uuidFromLink || raw;
        navigate(`/group/${uuid}`);
        setCode('');
        onClose();
        return;
      }

      // 2) join_code (6 ký tự)
      if (isJoinCode) {
        const joinCode = raw.toUpperCase();

        // Lấy group theo join_code
        const group = await groupOrdersApi.getByCode(joinCode);
        const groupId = group.id;

        // Kiểm tra trạng thái nhóm
        if (group.status !== 'open') {
          msgApi.error('Nhóm đã đóng, không thể tham gia.');
          return;
        }
        if (group.expires_at && new Date(group.expires_at).getTime() <= Date.now()) {
          msgApi.error('Nhóm đã hết hạn, không thể tham gia.');
          return;
        }

        // Kiểm tra “đã ở trong nhóm” bằng endpoint active
        try {
          const activeGroups = await groupOrdersApi.getActiveByUser(Number(uid));
          const isMember = Array.isArray(activeGroups)
            ? activeGroups.some((g: any) => g?.id === groupId)
            : false;

          if (isMember) {
            msgApi.info('Bạn đã ở trong nhóm này.');
            navigate(`/group-orders/${groupId}/detail`);
            onClose();
            return;
          }
        } catch {
          // nếu endpoint này lỗi, vẫn tiếp tục join bên dưới
        }

        // Join bằng joinCode
        try {
          await groupOrdersApi.join(groupId, { userId: Number(uid), joinCode });
          msgApi.success('Tham gia nhóm thành công!');
          navigate(`/group-orders/${groupId}/detail`);
          setCode('');
          onClose();
        } catch (err: any) {
          const msg: string = err?.response?.data?.message || '';
          if (msg.includes('not open')) msgApi.error('Nhóm đã đóng, không thể tham gia.');
          else if (msg.includes('expired')) msgApi.error('Nhóm đã hết hạn, không thể tham gia.');
          else if (msg.includes('Mã tham gia không hợp lệ')) msgApi.error('Mã tham gia không hợp lệ.');
          else if (msg.toLowerCase().includes('not found')) msgApi.error('Không tìm thấy nhóm với mã này.');
          else msgApi.error('Không thể tham gia nhóm, vui lòng thử lại.');
        }
        return;
      }

      // 3) Không phải UUID/Code hợp lệ
      msgApi.warning('Vui lòng nhập link mời (UUID) hoặc join code (6 ký tự).');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <>
      {contextHolder}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30">
        <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Tham gia nhóm mua chung</h3>
            <button
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-700"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
            <label className="block text-xs text-slate-600">
              Dán link mời (chứa UUID) hoặc nhập join code (6 ký tự)
            </label>

            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ví dụ: https://site.com/group/7e6b...abc hoặc E7DCJK"
              className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-cyan-600"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="h-9 rounded-md border border-slate-300 px-3 text-sm"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="h-9 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-wait disabled:bg-slate-400"
                disabled={loading}
              >
                {loading ? 'Đang xử lý…' : 'Tham gia'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default JoinGroupModal;