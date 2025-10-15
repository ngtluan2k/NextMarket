import React from 'react';
import { Check } from 'lucide-react';

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
      <div className="flex items-center justify-center gap-6">
        {steps.map((step, index) => {
          const reached = currentStep >= step.id;
          const passed = currentStep > step.id;
          return (
            <React.Fragment key={step.id}>
              <div className="text-center">
                <div
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${
                    reached ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {passed ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <div className="mt-2">
                  <div className="text-sm font-semibold text-slate-800">{step.title}</div>
                  <div className="text-xs text-slate-500">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-24 ${
                    currentStep > step.id ? 'bg-sky-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgress;
