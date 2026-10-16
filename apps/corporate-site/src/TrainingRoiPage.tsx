import trainingRoiHtml from '../../../public/training-roi/ai-time-back-360.html?raw';

export default function TrainingRoiPage() {
  return (
    <main className="min-h-screen bg-[#0B111B]" aria-label="AI Time-Back 360 training ROI measurement tool">
      <iframe
        title="AI Time-Back 360 training ROI measurement tool"
        srcDoc={trainingRoiHtml}
        className="block min-h-screen w-full border-0 bg-[#0B111B]"
      />
    </main>
  );
}
