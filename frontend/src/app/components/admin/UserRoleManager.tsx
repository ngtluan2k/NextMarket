// src/components/UserRoleManager.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Users as UsersIcon,
  Search as SearchIcon,
  UserPlus as UserPlusIcon,
  X as XIcon,
  Shield as ShieldIcon,
  AlertTriangle,
} from 'lucide-react';

interface Role {
  id: number;
  name: string;
}
interface User {
  id: number;
  email: string;
}
interface UserRole {
  id: number;
  user: User;
  role: Role;
}

export const UserRoleManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [loading, setLoading] = useState(true);

  // state cho confirm modal
  const [confirm, setConfirm] = useState<{
    open: boolean;
    userId?: number;
    roleId?: number;
    userEmail?: string;
    roleName?: string;
    submitting?: boolean;
  }>({ open: false });

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3000/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('fetchUsers error:', err);
      alert('Không tải được danh sách users.');
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('http://localhost:3000/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('fetchRoles error:', err);
      alert('Không tải được danh sách roles.');
    }
  };

  const fetchUserRoles = async () => {
    try {
      const res = await fetch('http://localhost:3000/user-roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUserRoles(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('fetchUserRoles error:', err);
      alert('Không tải được gán vai trò người dùng.');
    }
  };

  const reloadAll = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchRoles(), fetchUserRoles()]);
    setLoading(false);
  };

  useEffect(() => {
    reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) return;
    setIsAssigning(true);
    try {
      const res = await fetch(
        `http://localhost:3000/user-roles/users/${selectedUser}/roles/${selectedRole}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) {
        alert('Gán vai trò thất bại.');
        return;
      }
      await fetchUserRoles();
      setSelectedUser(null);
      setSelectedRole(null);
    } catch (err) {
      console.error('assignRole error:', err);
      alert('Có lỗi khi gán vai trò.');
    } finally {
      setIsAssigning(false);
    }
  };

  // mở confirm trước khi xoá
  const openRemoveConfirm = (
    userId: number,
    roleId: number,
    userEmail: string,
    roleName: string
  ) => {
    setConfirm({
      open: true,
      userId,
      roleId,
      userEmail,
      roleName,
      submitting: false,
    });
  };

  const handleConfirmRemove = async () => {
    if (!confirm.userId || !confirm.roleId) return;
    try {
      setConfirm((c) => ({ ...c, submitting: true }));
      const res = await fetch(
        `http://localhost:3000/user-roles/users/${confirm.userId}/roles/${confirm.roleId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) {
        alert('Xóa vai trò thất bại.');
        setConfirm((c) => ({ ...c, submitting: false }));
        return;
      }
      await fetchUserRoles();
      setConfirm({ open: false });
    } catch (err) {
      console.error('removeUserRole error:', err);
      alert('Có lỗi khi xóa vai trò.');
      setConfirm((c) => ({ ...c, submitting: false }));
    }
  };

  const usersWithRolesMap = useMemo(() => {
    return userRoles.reduce((acc, ur) => {
      if (!acc[ur.user.id])
        acc[ur.user.id] = { user: ur.user, roles: [] as Role[] };
      acc[ur.user.id].roles.push(ur.role);
      return acc;
    }, {} as Record<number, { user: User; roles: Role[] }>);
  }, [userRoles]);

  const usersWithRoles = useMemo(
    () =>
      users.map((user) => ({
        user,
        roles: usersWithRolesMap[user.id]?.roles || [],
      })),
    [users, usersWithRolesMap]
  );

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return usersWithRoles.filter(
      ({ user, roles }) =>
        user.email.toLowerCase().includes(q) ||
        roles.some((r) => r.name.toLowerCase().includes(q))
    );
  }, [usersWithRoles, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <UsersIcon className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Quản lý vai trò người dùng
            </h1>
          </div>
          <p className="text-gray-600">
            Gán và quản lý vai trò cho người dùng trong hệ thống
          </p>
        </div>

        {/* Assign */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <UserPlusIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Gán vai trò mới
            </h2>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Chọn người dùng
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(Number(e.target.value))}
              >
                <option value="">Chọn người dùng...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Chọn vai trò
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={selectedRole || ''}
                onChange={(e) => setSelectedRole(Number(e.target.value))}
              >
                <option value="">Chọn vai trò...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={assignRole}
                disabled={!selectedUser || !selectedRole || isAssigning}
                className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAssigning ? 'Đang gán...' : 'Gán vai trò'}
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo email hoặc vai trò..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-900 placeholder-gray-500 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Users list */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Danh sách người dùng ({filteredUsers.length})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <UsersIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                  <p className="text-gray-600">
                    {searchQuery
                      ? 'Không tìm thấy người dùng nào'
                      : 'Chưa có người dùng nào'}
                  </p>
                </div>
              ) : (
                filteredUsers.map(({ user, roles: userRolesList }) => (
                  <div
                    key={user.id}
                    className="px-6 py-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                            <span className="text-sm font-medium text-blue-700">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {user.email}
                          </span>
                        </div>

                        {userRolesList.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {userRolesList.map((role) => (
                              <div
                                key={role.id}
                                className="group flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 transition-colors hover:border-blue-300 hover:bg-blue-100"
                              >
                                <ShieldIcon className="h-3.5 w-3.5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">
                                  {role.name}
                                </span>

                                {/* mở confirm khi xoá */}
                                <button
                                  onClick={() =>
                                    openRemoveConfirm(
                                      user.id,
                                      role.id,
                                      user.email,
                                      role.name
                                    )
                                  }
                                  aria-label={`Xóa vai trò ${role.name} khỏi ${user.email}`}
                                  className="rounded p-1 text-blue-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-blue-200"
                                  title="Xóa vai trò"
                                >
                                  <XIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <ShieldIcon className="h-4 w-4" />
                            <span>Chưa có vai trò nào</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !confirm.submitting && setConfirm({ open: false })}
          />
          {/* dialog */}
          <div className="relative z-10 w-[92%] max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Xác nhận xoá
              </h3>
            </div>
            <p className="text-sm text-gray-700">
              Bạn có chắc muốn xoá vai trò{' '}
              <span className="font-semibold text-gray-900">
                “{confirm.roleName}”
              </span>{' '}
              khỏi người dùng{' '}
              <span className="font-semibold text-gray-900">
                “{confirm.userEmail}”
              </span>
              ?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setConfirm({ open: false })}
                disabled={confirm.submitting}
              >
                Hủy
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                onClick={handleConfirmRemove}
                disabled={confirm.submitting}
              >
                {confirm.submitting ? 'Đang xoá...' : 'Xoá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
