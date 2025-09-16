// src/components/admin/CategoryManager.tsx
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form } from "react-bootstrap";
import axios from "axios";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent?: Category | null;
  children?: Category[];
}

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:3000/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.data || res.data);
    } catch (err) {
      console.error("Fetch categories failed:", err);
      setCategories([]);
    }
  };

  const handleSave = async () => {
    if (!name) return;

    try {
      if (editingCategory) {
        // update
        await axios.put(
          `http://localhost:3000/categories/${editingCategory.id}`,
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // create
        await axios.post(
          "http://localhost:3000/categories",
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setShowModal(false);
      setEditingCategory(null);
      setName("");
      fetchCategories();
    } catch (err) {
      console.error("Save category failed:", err);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:3000/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCategories();
    } catch (err) {
      console.error("Delete category failed:", err);
    }
  };

  return (
    <div>
      <h3>Category Manager</h3>
      <Button
        className="mb-3"
        onClick={() => {
          setEditingCategory(null);
          setName("");
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.id}</td>
              <td>{cat.name}</td>
              <td>{cat.slug}</td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => handleEdit(cat)}
                >
                  Edit
                </Button>{" "}
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
            {editingCategory ? "Edit Category" : "Add Category"}
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
