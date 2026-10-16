import React from 'react';

const TRAINING_ROI_APP_URL = '/training-roi/ai-time-back-360.html';

export function TrainingRoiPage() {
  return (
    <section
      className="min-h-[720px] flex-1 bg-[#0B111B]"
      aria-labelledby="training-roi-page-title"
    >
      <h1 id="training-roi-page-title" className="sr-only">
        AI Time-Back 360 — Training ROI Measurement
      </h1>
      <iframe
        title="AI Time-Back 360 training ROI measurement tool"
        src={TRAINING_ROI_APP_URL}
        className="block h-[calc(100dvh-76px)] min-h-[720px] w-full border-0 bg-[#0B111B] min-[761px]:h-[calc(100dvh-80px)]"
        loading="eager"
      />
    </section>
  );
}
