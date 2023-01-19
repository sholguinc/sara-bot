export function chunkArray(arr: any[], size: number) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_: any, i: number) =>
    arr.slice(i * size, i * size + size),
  );
}
