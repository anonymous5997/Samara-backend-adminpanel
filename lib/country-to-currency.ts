// lib/country-to-currency.ts
export function countryCodeToCurrency(countryCode?: string): 'INR' | 'USD' | 'AED' | 'GBP' | 'CAD' {
  if (!countryCode) return 'INR';

  const cc = countryCode.toUpperCase();

  switch (cc) {
    case 'US':
    case 'UM': // US minor outlying
      return 'USD';
    case 'AE':
      return 'AED';
    case 'GB':
    case 'UK':
      return 'GBP';
    case 'CA':
      return 'CAD';
    case 'IN':
    default:
      return 'INR';
  }
}
