import { Country, State } from 'country-state-city';

export const getCountries = () =>
  Country.getAllCountries().map(c => ({
    value: c.isoCode,
    label: c.name,
  }));

export const getStatesByCountry = (countryCode: string) =>
  State.getStatesOfCountry(countryCode).map(s => ({
    value: s.isoCode,
    label: s.name,
  }));
