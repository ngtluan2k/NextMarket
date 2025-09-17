import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, ListGroup } from "react-bootstrap";
import axios from "axios";

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
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [parentQuery, setParentQuery] = useState("");
  const [filteredParents, setFilteredParents] = useState<Category[]>([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (parentQuery.trim() === "") {
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
      const payload = { name, image, parent_id: parentId };
      if (editingCategory) {
        await axios.put(
          `http://localhost:3000/categories/${editingCategory.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          "http://localhost:3000/categories",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setShowModal(false);
      setEditingCategory(null);
      setName("");
      setImage("");
      setParentId(null);
      setParentQuery("");
      setFilteredParents([]);
      fetchCategories();
    } catch (err) {
      console.error("Save category failed:", err);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setImage(cat.image || "");
    setParentId(cat.parent?.id || null);
    setParentQuery(cat.parent?.name || "");
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

  const selectParent = (cat: Category) => {
    setParentId(cat.id);
    setParentQuery(cat.name);
    setFilteredParents([]);
  };

  return (
    <div>
      <h3>Category Manager</h3>
      <Button
        className="mb-3"
        onClick={() => {
          setEditingCategory(null);
          setName("");
          setImage("");
          setParentId(null);
          setParentQuery("");
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
        <td>{cat.parent?.name || "-"}</td>
        <td>
          {cat.image ? (
            <img
              src={cat.image}
              alt={cat.name}
              style={{ width: "50px", height: "50px", objectFit: "cover" }}
            />
          ) : (
            "-"
          )}
        </td>
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

            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Enter image URL"
              />
            </Form.Group>

            <Form.Group className="mb-3" style={{ position: "relative" }}>
  <Form.Label>Parent Category</Form.Label>
  <div style={{ display: "flex", gap: "8px" }}>
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
          setParentId(null);
          setParentQuery("");
        }}
      >
        ✕
      </Button>
    )}
  </div>

  {filteredParents.length > 0 && (
    <ListGroup
      style={{
        position: "absolute",
        zIndex: 1000,
        width: "100%",
        maxHeight: "150px",
        overflowY: "auto",
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
