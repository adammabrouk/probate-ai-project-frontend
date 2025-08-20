import type { PrelimResponse } from "../types";

export const mockPrelimResponse: PrelimResponse = {
  kpis: [
    { label: "Total Records", value: 640 },
    { label: "Counties", value: 7 },
    { label: "Median Value", value: "$248k" },
    { label: "Median Acres", value: 0.44 },
    { label: "Absentee %", value: "61%" },
    { label: "With Parcel", value: "83%" },
    { label: "With qPublic", value: "71%" },
  ],

  charts: {
    absenteeByCounty: [
      { county: "Fulton", absentee: 92, local: 38 },
      { county: "DeKalb", absentee: 81, local: 45 },
      { county: "Clayton", absentee: 66, local: 51 },
      { county: "Henry", absentee: 44, local: 32 },
    ],

    daysSincePetitionHist: [
      { bucket: "0–30", count: 52 },
      { bucket: "31–60", count: 95 },
      { bucket: "61–90", count: 123 },
      { bucket: "91–180", count: 187 },
      { bucket: "181–365", count: 102 },
      { bucket: "365+", count: 48 },
    ],

    daysDeathToPetitionHist: [
      { bucket: "0–30", count: 24 },
      { bucket: "31–90", count: 72 },
      { bucket: "91–180", count: 139 },
      { bucket: "181–365", count: 210 },
      { bucket: "365+", count: 195 },
    ],

    valueByCounty: [
      { county: "Fulton", median_value: 410000 },
      { county: "DeKalb", median_value: 340000 },
      { county: "Clayton", median_value: 275000 },
      { county: "Henry", median_value: 298000 },
      { county: "Cherokee", median_value: 320000 },
    ],

    valueHist: [
      { bucket: "<100k", count: 68 },
      { bucket: "100–250k", count: 215 },
      { bucket: "250–500k", count: 243 },
      { bucket: "500k–1M", count: 97 },
      { bucket: "1M+", count: 17 },
    ],

    filingsByMonth: [
      { month: "2024-01", count: 42 },
      { month: "2024-02", count: 55 },
      { month: "2024-03", count: 61 },
      { month: "2024-04", count: 78 },
      { month: "2024-05", count: 83 },
      { month: "2024-06", count: 97 },
    ],

    filingsByMonthTiered: [
      { month: "2024-01", high: 14, med: 19, low: 9 },
      { month: "2024-02", high: 17, med: 24, low: 14 },
      { month: "2024-03", high: 21, med: 28, low: 12 },
      { month: "2024-04", high: 27, med: 39, low: 12 },
      { month: "2024-05", high: 31, med: 40, low: 12 },
      { month: "2024-06", high: 36, med: 48, low: 13 },
    ],

    absenteeRateTrend: [
      { month: "2024-01", rate: 0.57 },
      { month: "2024-02", rate: 0.59 },
      { month: "2024-03", rate: 0.63 },
      { month: "2024-04", rate: 0.60 },
      { month: "2024-05", rate: 0.62 },
      { month: "2024-06", rate: 0.65 },
    ],

    petitionTypes: [
      { petition_type: "Year’s Support", count: 218 },
      { petition_type: "Letters of Administration", count: 162 },
      { petition_type: "Probate Will", count: 97 },
      { petition_type: "Other", count: 46 },
    ],

    propertyClassMix: [
      { property_class: "R1 – Residential", count: 382 },
      { property_class: "R2 – Multi-Family", count: 121 },
      { property_class: "C1 – Commercial", count: 64 },
      { property_class: "A1 – Agricultural", count: 73 },
    ],

    holdingsTopParties: [
      { party: "Smith & Assoc.", holdings: 12 },
      { party: "William Allen Cater", holdings: 9 },
      { party: "Davis Family Trust", holdings: 7 },
      { party: "Jones Group", holdings: 5 },
    ],
  },

  thresholds: {
    absenteeRateTarget: 0.6,
    buyboxValueMin: 100000,
    buyboxValueMax: 400000,
  },

  shortlist: [
    {
        score: 91,
        tier: "high",
        county: "Fulton",
        case_no: "2024P31",
        owner_name: "ROY EDWARD DAY",
        property_address: "494 WEST MAIN STREET",
        city: "WILLACOOCHEE",
        property_value_2025: 245000,
        petition_date: "2024-06-14",
        absentee_flag: true,
        parcel_number: "12-345-67-890",
        qpublic_report_url: "https://qpublic.net/ga/fulton/parcel/12-345-67-890",
        rationale: "Absentee heir, median home, inside buy-box.",
        source_url: "",
        state: "",
        zip: "",
        party: "",
        mailing_address: "",
        petition_type: "",
        death_date: ""
    },
    {
        score: 88,
        tier: "medium",
        county: "DeKalb",
        case_no: "2024P38",
        owner_name: "BETTY R CATER",
        property_address: "422 WEST MAIN STREET",
        city: "WILLACOOCHEE",
        property_value_2025: 298000,
        petition_date: "2024-07-22",
        absentee_flag: false,
        parcel_number: "98-765-43-210",
        qpublic_report_url: "https://qpublic.net/ga/dekalb/parcel/98-765-43-210",
        rationale: "Local heir, but value inside buy-box.",
        source_url: "",
        state: "",
        zip: "",
        party: "",
        mailing_address: "",
        petition_type: "",
        death_date: ""
    },
  ],
};
