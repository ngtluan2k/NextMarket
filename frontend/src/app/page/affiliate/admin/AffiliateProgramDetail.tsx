'use client';

import React, { useState, useEffect } from 'react';
import { Drawer } from 'antd';
import { TagOutlined } from '@ant-design/icons';
import { AffiliateProgram } from '../../../types/affiliate';
import { getAffiliateProgramDetail} from '../../../../service/afiliate/affiliate.service';
import LoadingDrawer from '../../../components/admin/affiliate_admin_components/affiliate-admin-programdetail/LoadingDrawer';
import ErrorDrawer from '../../../components/admin/affiliate_admin_components/affiliate-admin-programdetail/ErrorDrawer';
import ProgramDetailContent from '../../../components/admin/affiliate_admin_components/affiliate-admin-programdetail/ProgramDetailContent';

interface AffiliateProgramDetailProps {
  programId: number | null;
  visible: boolean;
  onClose: () => void;
}

export default function AffiliateProgramDetail({
  programId,
  visible,
  onClose,
}: AffiliateProgramDetailProps) {
  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgramById = async (id: number) => {
    try {
      const data = await getAffiliateProgramDetail(id);
      if (!data) throw new Error('Không tìm thấy chương trình!');
      setProgram(data);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi không xác định.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (programId && visible) {
      setLoading(true);
      setError(null);
      setProgram(null);
      fetchProgramById(programId);
    } else if (!visible) {
      setProgram(null);
      return; 
    }
  }, [programId, visible]);

  if (!visible) {
    return null;
  }

  if (loading) {
    return <LoadingDrawer visible={visible} onClose={onClose} />;
  }

  if (error || !program) {
    return <ErrorDrawer visible={visible} onClose={onClose} error={error} />;
  }

  return (
    <Drawer
      title={
        <div className="flex items-center gap-3">
          <TagOutlined className="text-xl" />
          <span className="text-xl font-semibold">Chi tiết chương trình</span>
        </div>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
    >
      <ProgramDetailContent program={program} />
    </Drawer>
  );
}