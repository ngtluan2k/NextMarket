// src/components/admin/CategoryManager.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, ListGroup } from 'react-bootstrap';
import axios from 'axios';

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  parent?: Category | null;
  children?: Category[];
}

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [parentQuery, setParentQuery] = useState('');
  const [filteredParents, setFilteredParents] = useState<Category[]>([]);
  const token = localStorage.getItem('token');
  const [imageFile, setImageFile] = useState<File | null>(null); // file upload mới
  const [imagePreview, setImagePreview] = useState<string>(''); // preview ảnh

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (parentQuery.trim() === '') {
      setFilteredParents([]);
    } else {
      const filtered = categories
        .filter(
          (c) =>
            c.name.toLowerCase().includes(parentQuery.toLowerCase()) &&
            (!editingCategory || c.id !== editingCategory.id)
        )
        .slice(0, 5); // gợi ý tối đa 5
      setFilteredParents(filtered);
    }
  }, [parentQuery, categories, editingCategory]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:3000/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.data || res.data);
    } catch (err) {
      console.error('Fetch categories failed:', err);
      setCategories([]);
    }
  };

  const handleSave = async () => {
    if (!name) return;
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append(
        'parent_id',
        parentId !== null ? parentId.toString() : ''
      );
      if (imageFile) formData.append('image', imageFile);

      if (editingCategory) {
        await axios.put(
          `http://localhost:3000/categories/${editingCategory.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        await axios.post('http://localhost:3000/categories', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setShowModal(false);
      setEditingCategory(null);
      setName('');
      setParentId(null);
      setParentQuery('');
      setImageFile(null);
      setImagePreview('');
      fetchCategories();
    } catch (err) {
      console.error('Save category failed:', err);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setImageFile(null); // reset file mới
    setImagePreview(toImageUrl(cat.image || ''));
    setParentQuery(cat.parent?.name || '');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:3000/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCategories();
    } catch (err) {
      console.error('Delete category failed:', err);
    }
  };

  const selectParent = (cat: Category) => {
    setParentId(cat.id);
    setParentQuery(cat.name);
    setFilteredParents([]);
  };

  const toImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  };

  return (
    <div>
      <h3>Category Manager</h3>
      <Button
        className="mb-3"
        onClick={() => {
          setEditingCategory(null);
          setName('');
          setImageFile(null);
          setImagePreview('');
          setParentId(null);
          setParentQuery('');
          setShowModal(true);
        }}
      >
        + Add Category
      </Button>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Parent</th>
            <th>Image</th> {/* cột ảnh */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.id}</td>
              <td>{cat.name}</td>
              <td>{cat.slug}</td>
              <td>{cat.parent?.name || '-'}</td>
              <td>
                {cat.image ? (
                  <img
                    src={toImageUrl(cat.image)}
                    alt={cat.name}
                    style={{ width: 60 }}
                  />
                ) : (
                  '-'
                )}
              </td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => handleEdit(cat)}
                >
                  Edit
                </Button>{' '}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(cat.id)}
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
          <Modal.Title>
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Image</Form.Label>
              <Form.Control
                type="file"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]); // file mới
                    setImagePreview(URL.createObjectURL(e.target.files[0])); // preview mới
                  }
                }}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: 100, marginTop: 10, objectFit: 'cover' }}
                />
              )}
            </Form.Group>

            <Form.Group className="mb-3" style={{ position: 'relative' }}>
              <Form.Label>Parent Category</Form.Label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Form.Control
                  value={parentQuery}
                  onChange={(e) => {
                    setParentQuery(e.target.value);
                    setParentId(null); // reset parent khi user nhập mới
                  }}
                  placeholder="Search parent category"
                />
                {parentId && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      setParentId(null); // gỡ parent
                      setParentQuery(''); // reset input search
                    }}
                  >
                    ✕
                  </Button>
                )}
              </div>

              {filteredParents.length > 0 && (
                <ListGroup
                  style={{
                    position: 'absolute',
                    zIndex: 1000,
                    width: '100%',
                    maxHeight: '150px',
                    overflowY: 'auto',
                  }}
                >
                  {filteredParents.map((cat) => (
                    <ListGroup.Item
                      key={cat.id}
                      action
                      onClick={() => selectParent(cat)}
                    >
                      {cat.name}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
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

export default CategoryManager;
