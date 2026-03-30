export const MIN_UI_LOADER_MS = 3000;

export async function withMinimumLoader<T>(
  task: Promise<T>,
  minimumMs: number = MIN_UI_LOADER_MS,
): Promise<T> {
  const [result] = await Promise.all([
    task,
    new Promise((resolve) => setTimeout(resolve, minimumMs)),
  ]);
  return result;
}
