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
    <div className="row mb-4">
      <div className="col-12">
        <div className="d-flex align-items-center justify-content-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="text-center">
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center ${
                    currentStep >= step.id ? 'bg-danger text-white' : 'bg-light text-muted'
                  }`}
                  style={{ width: '40px', height: '40px' }}
                >
                  {step.id}
                </div>
                <div className="mt-2">
                  <small className="fw-bold">{step.title}</small>
                  <br />
                  <small className="text-muted">{step.description}</small>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-4 ${currentStep > step.id ? 'bg-danger' : 'bg-light'}`}
                  style={{ height: '2px', width: '100px' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepProgress;
