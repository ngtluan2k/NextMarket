import React, { useState } from "react";

const ReviewForm: React.FC = () => {
  const [orderId, setOrderId] = useState<number>(0);
  const [productId, setProductId] = useState<number>(0);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("orderId", String(orderId));
    formData.append("productId", String(productId));
    formData.append("rating", String(rating));
    formData.append("comment", comment);

    if (files) {
      Array.from(files).forEach((file) => {
        formData.append("media", file);
      });
    }

    try {
      // Lấy token JWT từ localStorage
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInVzZXJuYW1lIjoidHJ1bmcxMjMxMSIsImVtYWlsIjoidHJ1bmdAZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJBZG1pbiIsInVzZXIiLCJhYmMiLCJTZWxsZXIiXSwicGVybWlzc2lvbnMiOlsiYWRtaW4iLCJhZGRfcGVybWlzc2lvbiIsImFkZF9wZXJtaXNzaW9uX3RvX3JvbGUiLCJhZGRfcm9sZSIsImFzc2lnbl9yb2xlX3RvX3VzZXIiLCJjb3VudF9wZXJtaXNzaW9uX2J5X3JvbGUiLCJkZWxldGVfcGVybWlzc2lvbiIsImRlbGV0ZV9wZXJtaXNzaW9uX2Zyb21fcm9sZSIsImRlbGV0ZV9yb2xlIiwiZGVsZXRlX3JvbGVfZnJvbV91c2VyIiwidXBkYXRlX3Blcm1pc3Npb24iLCJ1cGRhdGVfcm9sZSIsInZpZXdfcGVybWlzc2lvbiIsInZpZXdfcm9sZSIsInZpZXdfdXNlcl9yb2xlIiwidmlld19wcm9kdWN0Iiwidmlld19jYXRlZ29yeSIsImNyZWF0ZV9jYXRlZ29yeSIsImRlbGV0ZV9jYXRlZ29yeSIsInVwZGF0ZV9jYXRlZ29yeSIsImNyZWF0ZV9zdG9yZSIsInZpZXdfc3RvcmUiLCJ1cGRhdGVfc3RvcmUiLCJkZWxldGVfc3RvcmUiLCJ2aWV3X3VzZXIiLCJkZWxldGVfcHJvZHVjdCIsInZpZXdfYnJhbmQiLCJjcmVhdGVfYnJhbmQiLCJ1cGRhdGVfYnJhbmQiLCJkZWxldGVfYnJhbmQiLCJjcmVhdGVfcHJvZHVjdCIsInVwZGF0ZV9wcm9kdWN0Iiwidmlld19vd25fc3RvcmUiLCJyZXN0b3JlX3N0b3JlIiwidmlld19wcm9kdWN0IiwiZGVsZXRlX3Byb2R1Y3QiLCJ2aWV3X3Byb2R1Y3QiLCJkZWxldGVfcHJvZHVjdCIsImFkbWluIiwidmlld19yb2xlIiwiYWRkX3JvbGUiLCJ1cGRhdGVfcm9sZSIsImRlbGV0ZV9yb2xlIiwidmlld19wZXJtaXNzaW9uIiwiYWRkX3Blcm1pc3Npb24iLCJ1cGRhdGVfcGVybWlzc2lvbiIsImRlbGV0ZV9wZXJtaXNzaW9uIiwiY291bnRfcGVybWlzc2lvbl9ieV9yb2xlIiwiYWRkX3Blcm1pc3Npb25fdG9fcm9sZSIsImRlbGV0ZV9wZXJtaXNzaW9uX2Zyb21fcm9sZSIsInZpZXdfdXNlcl9yb2xlIiwiYXNzaWduX3JvbGVfdG9fdXNlciIsImRlbGV0ZV9yb2xlX2Zyb21fdXNlciIsImNyZWF0ZV9zdG9yZSIsInZpZXdfc3RvcmUiLCJ1cGRhdGVfc3RvcmUiLCJkZWxldGVfc3RvcmUiLCJ2aWV3X3Byb2R1Y3QiLCJkZWxldGVfcHJvZHVjdCIsInZpZXdfb3duX3N0b3JlIiwiY3JlYXRlX3Byb2R1Y3QiLCJ1cGRhdGVfcHJvZHVjdCJdLCJpYXQiOjE3NTk2NTgwODMsImV4cCI6MTc1OTY2MTY4M30.Bkl62OioYIrqnqCTv76dyNptH8yEkUMD3J4Snpu9rYE";
      if (!token) throw new Error("No token found");

      const res = await fetch("http://localhost:3000/product-reviews", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setResult({ error: err.message });
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "20px auto" }}>
      <h2>Test Product Review Upload</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Order ID:
          <input
            type="number"
            value={orderId}
            onChange={(e) => setOrderId(Number(e.target.value))}
            required
          />
        </label>
        <br />

        <label>
          Product ID:
          <input
            type="number"
            value={productId}
            onChange={(e) => setProductId(Number(e.target.value))}
            required
          />
        </label>
        <br />

        <label>
          Rating:
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            <option value={1}>⭐</option>
            <option value={2}>⭐⭐</option>
            <option value={3}>⭐⭐⭐</option>
            <option value={4}>⭐⭐⭐⭐</option>
            <option value={5}>⭐⭐⭐⭐⭐</option>
          </select>
        </label>
        <br />

        <label>
          Comment:
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>
        <br />

        <label>
          Media:
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
          />
        </label>
        <br />

        <button type="submit">Submit Review</button>
      </form>

      {result && (
        <pre style={{ textAlign: "left", marginTop: 20 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default ReviewForm;
