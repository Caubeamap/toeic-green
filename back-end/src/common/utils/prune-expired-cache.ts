/**
 * Dọn các entry đã HẾT HẠN khỏi một cache Map in-memory khi map vượt ngưỡng kích
 * thước. Các cache TTL trong dự án (bootstrap session, kết quả làm bài, định danh
 * JWT) không tự xoá entry hết hạn; với nhiều người dùng / token xoay liên tục, entry
 * hết hạn tích tụ vô hạn → rò rỉ bộ nhớ trên hot path. Gọi trước mỗi `.set()`.
 *
 * An toàn tuyệt đối về tính đúng đắn: chỉ xoá entry đã hết hạn (đằng nào cũng bị coi
 * là miss khi đọc), nên cùng lắm là phải tính lại — không trả dữ liệu sai.
 *
 * Ngưỡng chống quét quá thường xuyên: chỉ quét khi map đủ lớn. Nếu working set thật
 * sự (số entry CÒN hạn) lớn hơn ngưỡng thì map vẫn bằng working set — bị chặn bởi
 * mức đồng thời thực tế, không phải tổng số người dùng theo thời gian.
 */
export function pruneExpiredEntries<V extends { expiresAt: number }>(
  cache: Map<string, V>,
  threshold: number,
  now: number = Date.now(),
): void {
  if (cache.size < threshold) {
    return;
  }
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
}
