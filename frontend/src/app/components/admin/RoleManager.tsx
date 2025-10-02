import React, { useEffect, useMemo, useState } from "react";
import {ConfigProvider,theme,Button,Input,Card,Tag,List,Checkbox,message,Skeleton,Empty,Badge,} from "antd";
import {TeamOutlined,PlusOutlined,SearchOutlined,SaveOutlined,CloseOutlined,LockOutlined,SafetyOutlined,KeyOutlined,ShopOutlined,ShoppingOutlined,UserOutlined,CheckCircleTwoTone,
} from "@ant-design/icons";


interface Permission {
  id: number;
  code: string;
  description: string;
}
interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}


const API_BASE =
  (globalThis as any).__API_BASE__ ||
  (globalThis as any).process?.env?.NEXT_PUBLIC_API_URL ||
  (() => { try { return (import.meta as any).env?.VITE_API_URL as string | undefined; } catch { return undefined; } })() ||
  "http://localhost:3000";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

export type PermissionGroup = {
  name: string;
  icon?: React.ReactNode;
  permissions: Permission[];
};


export function groupPermissionsForUI(
  perms: Permission[],
  query: string,
  options?: {
    labelMap?: Record<string, string>;
    iconMap?: Record<string, React.ReactNode>;
  }
): PermissionGroup[] {
  const { labelMap = {}, iconMap = {} } = options || {};
  const q = (query || "").toLowerCase();

  const filtered = perms.filter(
    (p) => p.description?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)
  );

  const buckets = new Map<string, Permission[]>();
  for (const p of filtered) {
    const code = (p.code || "").toLowerCase();
    const key = code.split(".")[0] || code.split("_")[0] || "other";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(p);
  }

  const groups: PermissionGroup[] = [];
  for (const [key, list] of buckets.entries()) {
    groups.push({
      name: labelMap[key] || capitalize(key),
      icon: iconMap[key],
      permissions: list,
    });
  }

  groups.sort((a, b) => a.name.localeCompare(b.name, "vi"));
  return groups;
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}


export const RoleManager: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<Set<number>>(new Set());
  const [roleName, setRoleName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);


  const [roleSearch, setRoleSearch] = useState("");
  const [permSearch, setPermSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(true);


  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const token = getToken();
      const res = await fetch(`${API_BASE}/role-permissions/roles-with-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      const rolesWithPerms: Role[] = (data.data || data).map((r: any) => ({
        id: r.id,
        name: r.name,
        permissions: r.permissions || [],
      }));
      setRoles(rolesWithPerms);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách vai trò");
    } finally {
      setLoadingRoles(false);
    }
  };


  const fetchPermissions = async () => {
    try {
      setLoadingPerms(true);
      const token = getToken();
      const res = await fetch(`${API_BASE}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch permissions");
      const data = await res.json();
      setPermissions(data.data || data);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách quyền");
    } finally {
      setLoadingPerms(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();

  }, []);

  const filteredRoles = useMemo(
    () => roles.filter((r) => r.name.toLowerCase().includes(roleSearch.toLowerCase())),
    [roles, roleSearch]
  );


  const labelMap = useMemo(
    () => ({
      role: "Roles",
      store: "Stores",
      product: "Products",
      user: "Users",
      audit: "Audit",
      other: "Other",
    }),
    []
  );
  const iconMap = useMemo(
    () => ({
      role: <KeyOutlined />,
      store: <ShopOutlined />,
      product: <ShoppingOutlined />,
      user: <UserOutlined />,
      audit: <SafetyOutlined />,
      other: undefined,
    }),
    []
  );

  const grouped = useMemo(
    () => groupPermissionsForUI(permissions, permSearch, { labelMap, iconMap }),
    [permissions, permSearch, labelMap, iconMap]
  );


  useEffect(() => {
    const next: Record<string, boolean> = {};
    grouped.forEach((g) => (next[g.name] = openGroups[g.name] ?? true));
    setOpenGroups(next);

  }, [permissions, permSearch]);


  const handleSelectRole = (roleId: number) => {
    const role = roles.find((r) => r.id === roleId) || null;
    setSelectedRole(role);
    setRoleName(role?.name || "");
    setSelectedPerms(new Set(role?.permissions.map((p) => p.id) || []));
    setIsCreatingNew(!roleId);
  };

  const handleCreateNew = () => {
    setSelectedRole(null);
    setRoleName("");
    setSelectedPerms(new Set());
    setIsCreatingNew(true);
  };

  const handleTogglePerm = (permId: number) => {
    const next = new Set(selectedPerms);
    next.has(permId) ? next.delete(permId) : next.add(permId);
    setSelectedPerms(next);
  };

  const handleToggleGroup = (groupPerms: Permission[]) => {
    const ids = groupPerms.map((p) => p.id);
    const all = ids.every((id) => selectedPerms.has(id));
    const next = new Set(selectedPerms);
    if (all) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    setSelectedPerms(next);
  };

  const handleInvertGroup = (groupPerms: Permission[]) => {
    const next = new Set(selectedPerms);
    groupPerms.forEach((p) => (next.has(p.id) ? next.delete(p.id) : next.add(p.id)));
    setSelectedPerms(next);
  };

  const handleToggleAll = () => {
    if (selectedPerms.size === permissions.length) setSelectedPerms(new Set());
    else setSelectedPerms(new Set(permissions.map((p) => p.id)));
  };

  const hasChanges = selectedRole
    ? roleName !== selectedRole.name ||
      selectedPerms.size !== selectedRole.permissions.length ||
      Array.from(selectedPerms).some((id) => !selectedRole.permissions.find((p) => p.id === id))
    : isCreatingNew && (roleName.trim() !== "" || selectedPerms.size > 0);

  const handleSave = async () => {
    try {
      const token = getToken();
      let roleId = selectedRole?.id;


      if (!roleId) {
        if (!roleName.trim()) {
          message.error("Vui lòng nhập tên vai trò");
          return;
        }
        const res = await fetch(`${API_BASE}/roles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: roleName }),
        });
        const data = await res.json();
        roleId = data.id || data.data?.id;
      } else if (selectedRole && selectedRole.name !== roleName) {
        await fetch(`${API_BASE}/roles/${selectedRole.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: roleName }),
        });
      }


      const oldPermIds = selectedRole?.permissions.map((p) => p.id) || [];
      for (const pid of oldPermIds) {
        if (!selectedPerms.has(pid)) {
          await fetch(`${API_BASE}/role-permissions/roles/${roleId}/permissions/${pid}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
      for (const pid of Array.from(selectedPerms)) {
        if (!oldPermIds.includes(pid)) {
          await fetch(`${API_BASE}/role-permissions/roles/${roleId}/permissions/${pid}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      await fetchRoles();
      setSelectedRole(null);
      setSelectedPerms(new Set());
      setRoleName("");
      setIsCreatingNew(false);
      message.success("Lưu vai trò thành công");
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi lưu vai trò");
    }
  };

  const handleCancel = () => {
    setSelectedRole(null);
    setRoleName("");
    setSelectedPerms(new Set());
    setIsCreatingNew(false);
  };

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: "#1677ff", colorBgContainer: "#ffffff" } }}>
      <div className="min-h-screen bg-white p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                <SafetyOutlined className="text-blue-600 text-lg" />
              </div>
              <h1 className="text-3xl font-semibold text-zinc-900">Quản lý Vai trò</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Roles List */}
            <Card className="lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                  <TeamOutlined className="text-zinc-500" />
                  Danh sách Vai trò
                </h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNew}>
                  Tạo mới
                </Button>
              </div>

              <Input
                placeholder="Tìm vai trò..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                prefix={<SearchOutlined />}
                className="mb-3"
              />

              {loadingRoles ? (
                <>
                  <Skeleton active paragraph={{ rows: 3 }} />
                  <Skeleton active paragraph={{ rows: 3 }} />
                </>
              ) : filteredRoles.length ? (
                <List
                  itemLayout="horizontal"
                  dataSource={filteredRoles}
                  renderItem={(role) => (
                    <List.Item className="!px-0">
                      <Button
                        onClick={() => handleSelectRole(role.id)}
                        className={`w-full text-left px-3 py-3 rounded-lg border transition-all ${
                          selectedRole?.id === role.id
                            ? "!bg-blue-50 !border-blue-300 !text-zinc-900"
                            : "bg-white border-zinc-200 hover:!border-zinc-300 text-zinc-700 hover:!text-zinc-900"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{role.name}</span>
                          <Badge count={role.permissions.length} style={{ backgroundColor: "#f0f0f0", color: "#444" }} />
                        </div>
                      </Button>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="Không tìm thấy vai trò" />
              )}
            </Card>

            {/* Editor */}
            <Card className="lg:col-span-2">
              {selectedRole || isCreatingNew ? (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                        <LockOutlined className="text-zinc-500" />
                        {isCreatingNew ? "Tạo Vai trò Mới" : "Chỉnh sửa Vai trò"}
                      </h2>
                      <Button onClick={handleCancel} icon={<CloseOutlined />}>Hủy</Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-zinc-700 mb-2 block">Tên Vai trò</label>
                        <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Nhập tên vai trò..." />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-zinc-700">Phân quyền ({selectedPerms.size} đã chọn)</label>
                          <div className="flex items-center gap-2">
                            <Button onClick={handleToggleAll}>
                              {selectedPerms.size === permissions.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            </Button>
                          </div>
                        </div>

                        <Input
                          prefix={<SearchOutlined />}
                          value={permSearch}
                          onChange={(e) => setPermSearch(e.target.value)}
                          placeholder="Tìm kiếm quyền..."
                          className="mb-4"
                        />

                        {loadingPerms ? (
                          <Skeleton active paragraph={{ rows: 8 }} />
                        ) : (
                          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
                            {grouped.map((group, idx) => {
                              const count = group.permissions.filter((p) => selectedPerms.has(p.id)).length;
                              const allSel = count === group.permissions.length && group.permissions.length > 0;
                              const isOpen = openGroups[group.name] ?? true;

                              return (
                                <div key={idx} className="space-y-2">
                                  <div className="flex items-center justify-between py-2 px-3 bg-zinc-50 rounded-lg border border-zinc-200">
                                    <div
                                      className="flex items-center gap-2 text-sm font-medium text-zinc-800 cursor-pointer"
                                      onClick={() => setOpenGroups((s) => ({ ...s, [group.name]: !isOpen }))}
                                    >
                                      {group.icon}
                                      <span>{group.name}</span>
                                      <Tag color={allSel ? "blue" : "default"}>
                                        {count}/{group.permissions.length}
                                      </Tag>
                                      <span className="text-zinc-500 text-xs">{isOpen ? "(thu gọn)" : "(mở rộng)"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button size="small" type="link" onClick={() => handleToggleGroup(group.permissions)}>
                                        {allSel ? "Bỏ chọn" : "Chọn tất cả"}
                                      </Button>
                                      <Button size="small" type="link" onClick={() => handleInvertGroup(group.permissions)}>
                                        Đảo chọn
                                      </Button>
                                    </div>
                                  </div>

                                  {isOpen && (
                                    <div className="space-y-2 pl-2">
                                      {group.permissions.map((perm) => {
                                        const checked = selectedPerms.has(perm.id);
                                        return (
                                          <div
                                            key={perm.id}
                                            className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                                              checked ? "bg-blue-50 border-blue-200" : "bg-white border-zinc-200 hover:border-zinc-300"
                                            }`}
                                          >
                                            <div className="flex items-center gap-3">
                                              <Checkbox checked={checked} onChange={() => handleTogglePerm(perm.id)} />
                                              <div className="min-w-0">
                                                <div className="font-medium text-zinc-900 text-sm">{perm.description}</div>
                                                <div className="text-xs text-zinc-500 mt-1 font-mono">{perm.code}</div>
                                              </div>
                                            </div>
                                            {checked && <CheckCircleTwoTone twoToneColor="#1677ff" />}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {!grouped.length && <Empty description="Không có quyền phù hợp" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 bg-white">
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} disabled={!hasChanges || !roleName.trim()}>
                      Lưu Vai trò
                    </Button>
                    <Button onClick={handleCancel} icon={<CloseOutlined />}>Hủy</Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 rounded-full bg-zinc-50 border border-zinc-200 mb-4">
                    <SafetyOutlined className="text-zinc-400 text-2xl" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 mb-2">Chưa chọn Vai trò</h3>
                  <p className="text-zinc-500 mb-6 max-w-sm">Chọn một vai trò từ danh sách để chỉnh sửa phân quyền, hoặc tạo vai trò mới để bắt đầu.</p>
                  <Button type="primary" onClick={handleCreateNew} icon={<PlusOutlined />}>Tạo Vai trò Mới</Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};
