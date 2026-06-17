export default function PracticeTestLoading() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-bold text-on-surface-variant">Đang tải đề thi</p>
      </div>
    </div>
  );
}
