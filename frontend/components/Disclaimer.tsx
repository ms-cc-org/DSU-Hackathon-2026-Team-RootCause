// A short note shown on every page: this tool predicts, it does not promise.
export default function Disclaimer() {
  return (
    <div className="disclaimer" role="note">
      <strong>This is a prediction tool.</strong> It uses past weather and crop records to give farmers and others a good idea of what to expect and when they could plant. It may not be accurate, so use it as a guide, not a guarantee.
    </div>
  );
}
