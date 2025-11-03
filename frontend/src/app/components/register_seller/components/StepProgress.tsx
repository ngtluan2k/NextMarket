import React from 'react';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
}

const StepProgress: React.FC<StepProgressProps> = ({ steps, currentStep }) => {
  return (
    <div className="mb-6">
      {/* auto-rows-[64px] giúp các ô có cùng chiều cao; items-stretch + h-full trên <li> để kéo giãn */}
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch auto-rows-[64px]">
        {steps.map((step) => {
          const active = currentStep >= step.id;
          return (
            <li
              key={step.id}
              aria-current={currentStep === step.id ? 'step' : undefined}
              className={`h-full rounded-xl border px-4 py-0 shadow-sm
                ${active ? 'border-sky-200 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-600'}
              `}
            >
              {/* flex + h-full + items-center để căn giữa theo chiều dọc, nhìn thẳng hàng */}
              <div className="flex h-full items-center gap-3">
                <div
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold
                    ${active ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'}
                  `}
                  title={`Bước ${step.id}`}
                >
                  {step.id}
                </div>

                {/* truncate để không làm tăng chiều cao khác nhau */}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{step.title}</div>
                  {/* ẩn mô tả ở màn hình nhỏ để giữ chiều cao đồng đều; hiện lại từ md */}
                  <div className="hidden md:block truncate text-xs text-slate-500">
                    {step.description}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default StepProgress;
