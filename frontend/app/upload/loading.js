export default function UploadLoading() {
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pt-20">
      <div className="bg-dq-surface rounded-xl border border-dq-border p-4 sm:p-6">
        <div className="h-8 w-48 bg-dq-border rounded animate-pulse mb-6" />
        <div className="h-40 w-full bg-dq-bg rounded-xl border border-dq-border animate-pulse" />
      </div>
    </div>
  );
}
