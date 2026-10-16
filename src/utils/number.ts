// 1248 -> 1.248
export const formatNumber = (value: number): string => new Intl.NumberFormat('id-ID').format(value);
