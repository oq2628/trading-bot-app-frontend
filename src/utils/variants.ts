export interface ProductVariantLike {
  id: string;
  name: string;
  price: number;
  duration_days: number | null;
  duration_months: number | null;
  is_lifetime: boolean;
  is_deleted?: boolean;
}

const LIFETIME_SORT_DAYS = Number.MAX_SAFE_INTEGER;

export const variantDurationSortValue = (variant: ProductVariantLike): number => {
  if (variant.is_lifetime) return LIFETIME_SORT_DAYS;
  if (variant.duration_days !== null && variant.duration_days !== undefined) return variant.duration_days;
  if (variant.duration_months !== null && variant.duration_months !== undefined) return variant.duration_months * 31;
  return LIFETIME_SORT_DAYS - 1;
};

export const sortVariantsByDuration = <T extends ProductVariantLike>(variants: T[]): T[] => {
  return [...variants].sort((a, b) => {
    const durationDiff = variantDurationSortValue(a) - variantDurationSortValue(b);
    if (durationDiff !== 0) return durationDiff;
    const priceDiff = a.price - b.price;
    if (priceDiff !== 0) return priceDiff;
    return a.name.localeCompare(b.name);
  });
};

export const activeSortedVariants = <T extends ProductVariantLike>(variants: T[] | undefined): T[] => {
  return sortVariantsByDuration((variants || []).filter(variant => !variant.is_deleted));
};

export const formatVariantDuration = (variant: ProductVariantLike): string => {
  if (variant.is_lifetime) return 'Lifetime Access';
  if (variant.duration_months) return `${variant.duration_months} Month(s)`;
  if (variant.duration_days) return `${variant.duration_days} Day(s)`;
  return 'Duration not set';
};

export const shortestVariant = <T extends ProductVariantLike>(variants: T[] | undefined): T | undefined => {
  return activeSortedVariants(variants)[0];
};
