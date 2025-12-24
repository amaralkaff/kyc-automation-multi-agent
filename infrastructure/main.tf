provider "google" {
  project = "your-gcp-project-id"
  region  = "us-central1"
}

# 1. Enable Required APIs
resource "google_project_service" "vertex_ai" {
  service = "aiplatform.googleapis.com"
}

resource "google_project_service" "bigquery" {
  service = "bigquery.googleapis.com"
}

resource "google_project_service" "discovery_engine" {
  service = "discoveryengine.googleapis.com" # For Search Grounding
}

# 2. BigQuery Setup
resource "google_bigquery_dataset" "kyc_data" {
  dataset_id                  = "kyc_data"
  friendly_name               = "KYC Data"
  description                 = "Dataset for KYC Customer Profiles"
  location                    = "US"
  default_table_expiration_ms = null

  depends_on = [google_project_service.bigquery]
}

resource "google_bigquery_table" "customer_profiles" {
  dataset_id = google_bigquery_dataset.kyc_data.dataset_id
  table_id   = "customer_profiles"

  schema = <<EOF
[
  {
    "name": "id",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "Primary Key / UUID"
  },
  {
    "name": "name",
    "type": "STRING",
    "mode": "REQUIRED"
  },
  {
    "name": "nik",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "National ID Number"
  },
  {
    "name": "risk_score",
    "type": "INTEGER",
    "mode": "NULLABLE"
  },
  {
    "name": "last_kyc_date",
    "type": "TIMESTAMP",
    "mode": "NULLABLE"
  }
]
EOF
}
