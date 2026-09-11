import { describe, expect, it } from 'vitest';
import { formatMoney, isDeliveryType, validateCheckoutRequirements } from '@/lib/catalog/types';

describe('catalog contracts', () => {
  it('recognizes supported delivery adapters', () => {
    expect(isDeliveryType('top_up')).toBe(true);
    expect(isDeliveryType('hardcoded_game')).toBe(false);
  });

  it('validates dynamic checkout requirements', () => {
    expect(validateCheckoutRequirements([
      { key: 'player_id', label: 'Player ID', type: 'text', required: true },
      { key: 'server', label: 'Server', type: 'select', required: true, options: ['EU', 'NA'] },
    ])).toBe(true);
  });

  it('rejects duplicate requirement keys', () => {
    expect(validateCheckoutRequirements([
      { key: 'player_id', label: 'Player', type: 'text', required: true },
      { key: 'player_id', label: 'Player again', type: 'text', required: false },
    ])).toBe(false);
  });

  it('formats integer minor units without floating-point storage', () => {
    expect(formatMoney(1999, 'USD', 'en-US')).toBe('$19.99');
  });
});
