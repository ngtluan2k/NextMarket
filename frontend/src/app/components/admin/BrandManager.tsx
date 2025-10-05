// src/components/admin/brandManager.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import axios from 'axios';

interface Brand {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
}

const BrandManager: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null); // file upload mới
  const [logoPreview, setLogoPreview] = useState<string>(''); // link hiện tại để show

  const token = localStorage.getItem('token'); // lấy token từ localStorage

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await axios.get('http://localhost:3000/brands', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // nếu backend trả { data: [...] } thì dùng res.data.data
      setBrands(res.data.data || res.data);
    } catch (err) {
      console.error('Fetch brands failed:', err);
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);

      if (logoFile) {
        // nếu chọn logo mới
        formData.append('logo', logoFile);
      }

      if (editingBrand) {
        await axios.put(
          `http://localhost:3000/brands/${editingBrand.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        await axios.post('http://localhost:3000/brands', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // reset form
      setShowModal(false);
      setEditingBrand(null);
      setName('');
      setDescription('');
      setLogoFile(null);
      setLogoPreview('');

      fetchBrands();
    } catch (err) {
      console.error('Save brand failed:', err);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setDescription(brand.description || '');
    setLogoFile(null); // reset file mới
    setLogoPreview(toImageUrl(brand.logo_url || '')); // giữ lại logo cũ để xem
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:3000/brands/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBrands();
    } catch (err) {
      console.error('Delete brand failed:', err);
    }
  };
  const toImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  };

  return (
    <div>
      <h3>Brand Manager</h3>
      <Button
        className="mb-3"
        onClick={() => {
          setEditingBrand(null);
          setName('');
          setDescription('');
          setLogoFile(null);
          setLogoPreview('');
          setShowModal(true);
        }}
      >
        + Add Brand
      </Button>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Logo</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((brand) => (
            <tr key={brand.id}>
              <td>{brand.id}</td>
              <td>{brand.name}</td>
              <td>{brand.description}</td>
              <td>
                {brand.logo_url ? (
                  <img
                    src={toImageUrl(brand.logo_url)}
                    alt={brand.name}
                    style={{ width: 60 }}
                  />
                ) : (
                  'No logo'
                )}
              </td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => handleEdit(brand)}
                >
                  Edit
                </Button>{' '}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(brand.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingBrand ? 'Edit Brand' : 'Add Brand'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter brand name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Logo</Form.Label>
              <Form.Control
                type="file"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files[0]) {
                    setLogoFile(e.target.files[0]);
                    setLogoPreview(URL.createObjectURL(e.target.files[0])); // preview ảnh mới chọn
                  }
                }}
              />
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="logo preview"
                  style={{ width: 100, marginTop: 10 }}
                />
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BrandManager;
