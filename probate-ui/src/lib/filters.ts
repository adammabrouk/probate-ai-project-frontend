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
  property_class?: string;
  days_since_petition_min?: number;
  days_since_petition_max?: number;
  days_death_to_petition_min?: number;
  days_death_to_petition_max?: number;
  has_value?: boolean;
};