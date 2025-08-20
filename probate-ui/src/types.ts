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
  qpublic_report_url?: string;
  parcel_number?: string;
  property_class?: string;
  property_tax_district?: string;
  property_value_2025?: number;
  property_acres?: number;
  absentee_flag?: boolean;
  days_since_petition?: number;
  days_since_death?: number;
  holdings_in_file?: number;
  score?: number;
  tier?: "high" | "medium" | "low";
  rationale?: string;
};

export type KPI = {
  label: string; 
  value: string | number;
  hint?: string; // Optional hint for additional context
}

// Types for preliminary analysis charts
export type PrelimCharts = {
  // --- Overview ---
  filingsByMonth: { month: string; count: number }[];
  filingsByMonthTiered: { month: string; low: number; med: number; high: number }[];
  absenteeRateTrend: { month: string; rate: number }[];
  propertyClassMix: { property_class: string; count: number }[];

  // --- Counties ---
  absenteeByCounty: { county: string; absentee: number; local: number }[];
  valueByCounty: { county: string; median_value: number }[];

  // --- Timing ---
  daysSincePetitionHist: { bucket: string; count: number }[];
  daysDeathToPetitionHist: { bucket: string; count: number }[];
  petitionTypes: { petition_type: string; count: number }[];

  // --- Value & Class ---
  valueHist: { bucket: string; count: number }[];
  holdingsTopParties: { party: string; holdings: number }[];
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

export type PrelimResponse = {
  /** Headline KPIs (cards at the top of dashboard) */
  kpis: KPI[];

  /** All chart data */
  charts: {
    absenteeByCounty: { county: string; absentee: number; local: number }[];
    daysSincePetitionHist: { bucket: string; count: number }[];
    daysDeathToPetitionHist: { bucket: string; count: number }[];
    valueByCounty: { county: string; median_value: number }[];
    valueHist: { bucket: string; count: number }[];
    filingsByMonth: { month: string; count: number }[];
    filingsByMonthTiered: { month: string; high: number; med: number; low: number }[];
    absenteeRateTrend: { month: string; rate: number }[];
    petitionTypes: { petition_type: string; count: number }[];
    propertyClassMix: { property_class: string; count: number }[];
    holdingsTopParties: { party: string; holdings: number }[];
  };

  /** Thresholds (for drawing reference lines or shading) */
  thresholds?: {
    absenteeRateTarget: number;  // e.g. 0.6 → 60%
    buyboxValueMin: number;
    buyboxValueMax: number;
  };

  /** Table of shortlisted leads */
  shortlist: RecordRow[];
};