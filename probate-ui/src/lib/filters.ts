export type Filters = {
  counties?: string[];
  petition_types?: string[];
  tiers?: string[];
  absentee_only?: boolean;
  has_parcel?: boolean;
  has_qpublic?: boolean;
  min_value?: number;
  max_value?: number;
  month_from?: string; // "YYYY-MM"
  month_to?: string;
};