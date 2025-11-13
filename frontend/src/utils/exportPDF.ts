// utils/exportPDF.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Xuất một phần tử HTML ra file PDF
 * @param elementId id của phần tử HTML muốn xuất
 * @param fileName tên file PDF xuất ra
 */
export const exportPDF = async (
  elementId: string,
  fileName = 'dashboard.pdf'
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Không tìm thấy phần tử với id: ${elementId}`);
    return;
  }

  try {
    // --- 1. Đợi tất cả ảnh load xong ---
    const images = Array.from(element.getElementsByTagName('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve();
            else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          })
      )
    );

    // --- 2. Chụp element bằng html2canvas ---
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true, // hỗ trợ ảnh từ server khác
      allowTaint: false,
    });

    // --- 3. Chuyển canvas sang image ---
    const imgData = canvas.toDataURL('image/png');

    // --- 4. Tạo PDF ---
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(fileName);
    console.log(`✅ Xuất PDF thành công: ${fileName}`);
  } catch (error) {
    console.error('Xuất PDF thất bại:', error);
  }
};
