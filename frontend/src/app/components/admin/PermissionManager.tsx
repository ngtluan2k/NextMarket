// src/components/admin/permissionMnager.tsx
import React, { useEffect, useState } from 'react';

interface Permission {
  id: number;
  code: string;
  description: string;
}

export const PermissionManager: React.FC = () => {
  const [perms, setPerms] = useState<Permission[]>([]);
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');

  const token = localStorage.getItem('token');
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

  const fetchPerms = async () => {
    try {
      const res = await fetch(`${BE_BASE_URL}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error('Fetch permissions failed:', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      setPerms(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
      setPerms([]);
    }
  };

  const handleCreatePerm = async () => {
    if (!code || !desc) return;
    try {
      const res = await fetch(`${BE_BASE_URL}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, description: desc }),
      });
      if (!res.ok) {
        console.error('Create permission failed:', res.status, res.statusText);
        return;
      }
      setCode('');
      setDesc('');
      fetchPerms();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPerms();
  }, []);

  return (
    <div>
      <h4>Permissions</h4>
      <ul className="list-group mb-3">
        {perms.map((p) => (
          <li key={p.id} className="list-group-item">
            {p.code} - {p.description}
          </li>
        ))}
      </ul>
      <div className="mb-2">
        <input
          type="text"
          className="form-control mb-1"
          placeholder="Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <input
          type="text"
          className="form-control mb-1"
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <button className="btn btn-primary w-100" onClick={handleCreatePerm}>
          Add Permission
        </button>
      </div>
    </div>
  );
};
