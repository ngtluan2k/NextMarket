import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form } from "react-bootstrap";
import axios from "axios";

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const token = localStorage.getItem("token"); // lấy token từ localStorage

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await axios.get("http://localhost:3000/brands", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // nếu backend trả { data: [...] } thì dùng res.data.data
      setBrands(res.data.data || res.data);
    } catch (err) {
      console.error("Fetch brands failed:", err);
    }
  };

  const handleSave = async () => {
    const payload = { name, description, logo_url: logoUrl };
    try {
      if (editingBrand) {
        // update
        await axios.put(
          `http://localhost:3000/brands/${editingBrand.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // create
        await axios.post("http://localhost:3000/brands", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowModal(false);
      setEditingBrand(null);
      setName("");
      setDescription("");
      setLogoUrl("");
      fetchBrands();
    } catch (err) {
      console.error("Save brand failed:", err);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setDescription(brand.description || "");
    setLogoUrl(brand.logo_url || "");
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:3000/brands/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBrands();
    } catch (err) {
      console.error("Delete brand failed:", err);
    }
  };

  return (
    <div>
      <h3>Brand Manager</h3>
      <Button
        className="mb-3"
        onClick={() => {
          setEditingBrand(null);
          setName("");
          setDescription("");
          setLogoUrl("");
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
                    src={brand.logo_url}
                    alt={brand.name}
                    style={{ width: 60 }}
                  />
                ) : (
                  "No logo"
                )}
              </td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => handleEdit(brand)}
                >
                  Edit
                </Button>{" "}
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
          <Modal.Title>{editingBrand ? "Edit Brand" : "Add Brand"}</Modal.Title>
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
              <Form.Label>Logo URL</Form.Label>
              <Form.Control
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Enter logo URL"
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

export default BrandManager;
