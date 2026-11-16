export type ReferenceValue = {
  value: number | null;
  basis: "sourced" | "illustrative";
  source_id: string | null;
  note: string;
};
export type PublicSource = {
  id: string;
  title: string;
  url: string;
  retrieved_on: string;
  field: string;
  license_url: string;
  license_note: string;
};
export type PanelGene = {
  gene_symbol: string;
  hgnc_id: string;
  symbol_source_id: string;
  engine_support: "supported" | "educational_only";
  support_note: string;
  conditions: {
    name_en: string;
    name_ar: null;
    inheritance: "autosomal_recessive";
    severity_band: "variable";
    summary: string;
    source_id: string;
  }[];
  reference_values: Record<
    "carrier_frequency" | "allele_frequency_q" | "detection_rate",
    ReferenceValue
  >;
};
export type PanelData = {
  panel_version: string;
  panel: {
    panel_id: string;
    version: string;
    label: string;
    disclaimer: string;
    genes: PanelGene[];
    sources: PublicSource[];
  };
};
