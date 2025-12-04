import React from 'react';
import { groupOrdersApi } from '../../../../service/groupOrderItems.service';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type Props = {
  groupId: number;
};

export default function GroupOrderInfoBar({ groupId }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [group, setGroup] = React.useState<any>(null);
  const [showInvite, setShowInvite] = useState(false);

  const inviteUrl =
    group?.invite_link ||
    `${window.location.origin}/group/${group?.uuid ?? ''}`;

  React.useEffect(() => {
    if (!groupId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await groupOrdersApi.getById(groupId);
        setGroup(res);
        setError(null);
      } catch (e: any) {
        setError('Không tải được thông tin nhóm');
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  if (!groupId) return null;

  return (
    <div className="w-full border-b bg-sky-50">
      <div className="mx-auto max-w-screen-2xl px-4 py-3">
        {loading ? (
          <div className="text-slate-600 text-sm">
            Đang tải thông tin nhóm...
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm">{error}</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
                  G
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                     {group?.name ?? '—'}
                  </div>
                  <div className="text-xs text-slate-600">
                    Trạng thái: {group?.status} • Mã tham gia:{' '}
                    {group?.join_code ?? '—'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInvite(true)}
                  className="text-sm font-semibold text-sky-700 hover:text-sky-800 underline"
                >
                  Mời bạn bè tham gia
                </button>

                <button
                  onClick={() => navigate(`/group-orders/${groupId}/detail`)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-sky-300 text-sky-700 text-sm font-semibold hover:bg-sky-50"
                >
                  Xem mọi người chọn gì
                </button>
              </div>
            </div>

            {/* Popup đơn giản hiển thị link + copy */}
            {showInvite && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
                  <div className="mb-3 text-base font-semibold">
                    Chia sẻ liên kết tham gia
                  </div>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={inviteUrl}
                      className="flex-1 rounded-lg border px-3 py-2 text-sm"
                    />
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(inviteUrl);
                        alert('Đã sao chép liên kết!');
                      }}
                      className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setShowInvite(false)}
                      className="px-3 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-50"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
