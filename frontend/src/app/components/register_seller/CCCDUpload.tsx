import React, { useState, useEffect } from 'react';

type Side = 'front' | 'back';

interface Props {
  onFileSelected?: (side: Side, file: File | null) => void;
  frontFile?: File | null;
  backFile?: File | null;
  className?: string;
}

export const CCCDUpload: React.FC<Props> = ({
  onFileSelected,
  frontFile: propFrontFile,
  backFile: propBackFile,
  className,
}) => {
  const [frontFile, setFrontFile] = useState<File | null>(
    propFrontFile || null
  );
  const [backFile, setBackFile] = useState<File | null>(propBackFile || null);

  // Sync with props
  useEffect(() => {
    setFrontFile(propFrontFile || null);
  }, [propFrontFile]);

  useEffect(() => {
    setBackFile(propBackFile || null);
  }, [propBackFile]);

  return (
    <div className={className}>
      <h6>�� Ảnh CCCD</h6>

      <div className="row g-3">
        {/* Mặt trước */}
        <div className="col-md-6">
          <div className="border rounded p-3 bg-light">
            <div className="mb-2 fw-bold">🟢 Mặt trước</div>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFrontFile(f);
                onFileSelected?.('front', f);
              }}
              className="form-control mb-2"
            />
            {frontFile && (
              <img
                src={URL.createObjectURL(frontFile)}
                alt="CCCD front preview"
                style={{ maxWidth: '100%', maxHeight: 180 }}
                className="mb-2"
              />
            )}
          </div>
        </div>

        {/* Mặt sau */}
        <div className="col-md-6">
          <div className="border rounded p-3 bg-light">
            <div className="mb-2 fw-bold">🔴 Mặt sau</div>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setBackFile(f);
                onFileSelected?.('back', f);
              }}
              className="form-control mb-2"
            />
            {backFile && (
              <img
                src={URL.createObjectURL(backFile)}
                alt="CCCD back preview"
                style={{ maxWidth: '100%', maxHeight: 180 }}
                className="mb-2"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCCDUpload;
