export type RecordRow = {
  county: string;
  source_url: string;
  case_no: string;
  owner_name: string;          // Decedent
  property_address: string;    // Street Address
  city: string;
  state: string;
  zip: string;
  party: string;               // Petitioner
  mailing_address: string;     // Party Street+City+State+Zip
  petition_type: string;
  petition_date: string;       // ISO date
  death_date: string;          // ISO date
  absentee_flag: boolean;
  days_since_petition: number;
  days_since_death: number;
  holdings_in_file: number;
  score: number;
  tier: "high" | "medium" | "low";
  rationale: string;
};

export type Charts = {
  tiers: Record<string, number>;
  top_counties: Record<string, number>;
  petition_types: Record<string, number>;
  by_month: { month: string; count: number }[];
  absentee_rate: number;
};

export type AnalyzeResponse = {
  records: RecordRow[];
  charts: Charts;
  sample_size: number;
};
