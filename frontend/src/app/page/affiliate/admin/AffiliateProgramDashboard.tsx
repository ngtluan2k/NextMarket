'use client';

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { AffiliateProgram, AffiliateProgramFormData, CreateAffiliateProgramDto } from '../../../types/affiliate';
import {
  updateAffiliateProgram,
  createAffiliateProgram,
  deleteAffiliateProgram,
  hardDeleteAffiliateProgram,
  getAllAffiliatePrograms,
} from '../../../../service/afiliate/affiliate.service';
import AffiliateProgramDetail from './AffiliateProgramDetail';
import AffiliateProgramStatistic from '../../../components/admin/affiliate_admin_components/affiliate-programs/AffiliateProgramStatistic';
import AffiliateProgramsTable from '../../../components/admin/affiliate_admin_components/affiliate-programs/AffiliateProgramTable';
import AffiliateProgramFormModal from '../../../components/admin/affiliate_admin_components/affiliate-programs/AffiliateProgramFormModal';

// Memoized program card
const ProgramCard = memo(({ program, onEdit, onView }: any) => (
  <div className="p-4 border rounded-lg hover:shadow-lg transition">
    <h3 className="font-semibold text-lg">{program.name}</h3>
    <p className="text-sm text-gray-500">{program.status}</p>
    <div className="mt-3 flex gap-2">
      <Button size="small" onClick={() => onEdit(program)}>Edit</Button>
      <Button size="small" onClick={() => onView(program.id)}>View</Button>
    </div>
  </div>
));

const AffiliateProgramDashboard = () => {
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<AffiliateProgram | null>(null);
  const [viewingProgramId, setViewingProgramId] = useState<number | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  // Memoize chart data processing
  const processChartData = useCallback((programs: AffiliateProgram[]) => {
    const dataForChart: any[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      dataForChart.push({
        time: `${month} ${year}`,
        value: 0,
        type: 'Programs Created',
      });
    }

    const monthlyDataMap = new Map(dataForChart.map((d) => [d.time, d]));
    programs.forEach((program) => {
      if (!program.created_at) return;
      const date = new Date(program.created_at);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const timeKey = `${month} ${year}`;
      if (monthlyDataMap.has(timeKey)) {
        monthlyDataMap.get(timeKey)!.value += 1;
      }
    });

    setChartData(Array.from(monthlyDataMap.values()));
  }, []);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllAffiliatePrograms();

      if (Array.isArray(response)) {
        setPrograms(response);
        processChartData(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setPrograms(response.data);
        processChartData(response.data);
      } else {
        setPrograms([]);
        console.warn('Unexpected response structure:', response);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      message.error('Không thể tải dữ liệu chương trình tiếp thị liên kết');
    } finally {
      setLoading(false);
    }
  }, [processChartData]);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleViewDetail = (id: number) => {
    setViewingProgramId(id);
    setIsDetailVisible(true);
  };

  const openModalForCreate = () => {
    setEditingProgram(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (program: AffiliateProgram) => {
    setEditingProgram(program);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProgram(null);
  };

  const handleSubmit = async (values: AffiliateProgramFormData) => {
    try {
      if (!values.name || values.cookie_days == null || values.commission_type == null || values.commission_value == null) {
        message.error('Vui lòng điền đầy đủ các trường bắt buộc.');
        return;
      }

      let response;
      if (editingProgram) {
        const updateDto: Partial<CreateAffiliateProgramDto> = {
          name: values.name,
          cookie_days: values.cookie_days,
          commission_type: values.commission_type,
          commission_value: Number(values.commission_value),
          status: values.status,
          total_budget_amount: values.total_budget_amount,
          monthly_budget_cap: values.monthly_budget_cap,
          daily_budget_cap: values.daily_budget_cap,
          auto_pause_on_budget_limit: values.auto_pause_on_budget_limit,
        };
        response = await updateAffiliateProgram(editingProgram.id, updateDto);
      } else {
        const createDto: CreateAffiliateProgramDto = {
          name: values.name,
          cookie_days: values.cookie_days,
          commission_type: values.commission_type,
          commission_value: values.commission_value,
          status: values.status,
          total_budget_amount: values.total_budget_amount,
          monthly_budget_cap: values.monthly_budget_cap,
          daily_budget_cap: values.daily_budget_cap,
          auto_pause_on_budget_limit: values.auto_pause_on_budget_limit,
        };
        response = await createAffiliateProgram(createDto);
      }

      if (response) {
        message.success(editingProgram ? 'Cập nhật chương trình thành công' : 'Tạo chương trình thành công');
        closeModal();
        fetchPrograms();
      } else {
        message.error('Thao tác thất bại');
      }
    } catch (error) {
      message.error('Đã xảy ra lỗi');
      console.error('Error in handleSubmit:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await deleteAffiliateProgram(id);
      if (response) {
        message.success('Xoá tạm thời chương trình thành công');
        fetchPrograms();
      } else {
        message.error('Không thể xóa chương trình');
      }
    } catch (error) {
      message.error('Đã xảy ra lỗi');
    }
  };

  const handleHardDelete = async (id: number) => {
    try {
      const response = await hardDeleteAffiliateProgram(id);
      if (response) {
        message.success('Xoá cứng chương trình thành công. Tất cả dữ liệu liên quan đã bị xóa vĩnh viễn.');
        fetchPrograms();
      } else {
        message.error('Không thể xóa cứng chương trình');
      }
    } catch (error) {
      message.error('Đã xảy ra lỗi khi xóa cứng chương trình');
    }
  };

  const activePrograms = programs.filter((p) => p.status === 'active').length;
  const totalPrograms = programs.length;
  
  // Calculate average revenue and commission from actual data
  const programsWithData = programs.filter(p => (p.avg_revenue || 0) > 0 || (p.avg_commission || 0) > 0);
  const avgRevenue = programsWithData.length > 0
    ? programs.reduce((acc, p) => acc + (p.avg_revenue || 0), 0) / programsWithData.length
    : 0;
  const avgCommission = programsWithData.length > 0
    ? programs.reduce((acc, p) => acc + (p.avg_commission || 0), 0) / programsWithData.length
    : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý Chương trình Tiếp thị Liên kết</h1>
            <p className="mt-1 text-muted-foreground">
              Quản lý các chương trình, hoa hồng và theo dõi tiếp thị liên kết của hệ thống Everymart
            </p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openModalForCreate} size="large">
            Tạo Chương trình
          </Button>
        </div>

        <AffiliateProgramStatistic
          totalPrograms={totalPrograms}
          activePrograms={activePrograms}
          avgRevenue={avgRevenue}
          avgCommission={avgCommission}
          chartData={chartData}
        />

        <AffiliateProgramsTable
          programs={programs}
          loading={loading}
          onView={handleViewDetail}
          onEdit={openModalForEdit}
          onDelete={handleDelete}
          onHardDelete={handleHardDelete}
        />

        <AffiliateProgramFormModal
          visible={isModalOpen}
          editingProgram={editingProgram}
          onCancel={closeModal}
          onSubmit={handleSubmit}
        />

        {viewingProgramId && (
          <AffiliateProgramDetail
            programId={viewingProgramId}
            visible={isDetailVisible}
            onClose={() => setIsDetailVisible(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AffiliateProgramDashboard;