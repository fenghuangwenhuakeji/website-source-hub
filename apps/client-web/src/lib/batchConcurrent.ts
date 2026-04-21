const MAX_CONCURRENCY = 6;

export async function batchConcurrent<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options?: {
    batchSize?: number;
    onBatch?: (results: PromiseSettledResult<R>[], startIndex: number) => void;
  },
): Promise<PromiseSettledResult<R>[]> {
  const batchSize = options?.batchSize ?? MAX_CONCURRENCY;
  const allResults: PromiseSettledResult<R>[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((item, batchIndex) => fn(item, i + batchIndex)),
    );
    allResults.push(...batchResults);
    options?.onBatch?.(batchResults, i);
  }

  return allResults;
}
