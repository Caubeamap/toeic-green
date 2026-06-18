/**
 * Trả về một mảng mới đã được xáo trộn ngẫu nhiên (Fisher-Yates).
 * Không làm thay đổi mảng gốc.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = items.slice();

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
