/** Anything a product realistically has on hand when it needs to show a date. */
export type DateInput = Date | string | number;

/**
 * Normalises a date-ish value into a `Date`, or `null` when the input cannot be
 * parsed. Returning `null` rather than an Invalid Date keeps the failure
 * explicit at the call site.
 */
export function toDate(input: DateInput): Date | null {
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}
