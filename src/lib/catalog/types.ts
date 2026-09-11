export const catalogStatuses = ['draft', 'active', 'hidden', 'archived'] as const;
export type CatalogStatus = (typeof catalogStatuses)[number];

export const deliveryTypes = ['automatic_api', 'top_up', 'trade', 'mail', 'manual'] as const;
export type DeliveryType = (typeof deliveryTypes)[number];

export const requirementTypes = ['text', 'textarea', 'email', 'number', 'select'] as const;
export type RequirementType = (typeof requirementTypes)[number];

export interface CheckoutRequirement {
  key: string;
  label: string;
  type: RequirementType;
  required: boolean;
  options?: string[] | undefined;
  placeholder?: string | undefined;
  helpText?: string | undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function isDeliveryType(value: unknown): value is DeliveryType {
  return typeof value === 'string' && (deliveryTypes as readonly string[]).includes(value);
}

export function validateCheckoutRequirements(value: unknown): value is CheckoutRequirement[] {
  if (!Array.isArray(value)) return false;
  const keys = new Set<string>();
  return value.every((item) => {
    if (!isRecord(item) || !isText(item.key) || !/^[a-z][a-z0-9_]*$/.test(item.key) || keys.has(item.key)) return false;
    keys.add(item.key);
    if (!isText(item.label) || !(requirementTypes as readonly unknown[]).includes(item.type) || typeof item.required !== 'boolean') return false;
    if (item.type === 'select' && (!Array.isArray(item.options) || item.options.length === 0 || !item.options.every(isText))) return false;
    return item.options === undefined || (Array.isArray(item.options) && item.options.every(isText));
  });
}

export function formatMoney(minorUnits: number, currency: string, locale = 'ru-RU'): string {
  if (!Number.isSafeInteger(minorUnits)) throw new Error('Money must use safe integer minor units');
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.toUpperCase() }).format(minorUnits / 100);
}
