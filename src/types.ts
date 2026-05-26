export interface CurrencyMetadata {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  continent: 'Americas' | 'Europe' | 'Asia' | 'Africa' | 'Oceania' | 'Middle East';
  countries: string[];
}

export interface HistoricalRatePoint {
  date: string;
  rate: number;
  rateFormatted: string;
}

export interface ConversionItem {
  id: string;
  code: string;
  amount: number;
}
