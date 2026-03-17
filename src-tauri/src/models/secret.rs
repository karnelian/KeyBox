use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Secret {
    pub id: String,
    pub name: String,
    pub secret_value: String,
    pub service: String,
    pub category_id: Option<String>,
    pub project_id: Option<String>,
    pub pinned: bool,
    pub tags: Vec<String>,
    pub notes: String,
    pub environment: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SecretListItem {
    pub id: String,
    pub name: String,
    pub service: String,
    pub category_id: Option<String>,
    pub project_id: Option<String>,
    pub pinned: bool,
    pub tags: Vec<String>,
    pub environment: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSecretInput {
    pub name: String,
    pub secret_value: String,
    pub service: String,
    pub category_id: Option<String>,
    pub project_id: Option<String>,
    pub tags: Vec<String>,
    pub notes: String,
    pub environment: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSecretInput {
    pub id: String,
    pub name: Option<String>,
    pub secret_value: Option<String>,
    pub service: Option<String>,
    pub category_id: Option<Option<String>>,
    pub project_id: Option<Option<String>>,
    pub tags: Option<Vec<String>>,
    pub notes: Option<String>,
    pub environment: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GetSecretsFilter {
    pub category_id: Option<String>,
    pub project_id: Option<String>,
    pub environment: Option<String>,
    pub tag: Option<String>,
    pub query: Option<String>,
    pub pinned_only: Option<bool>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SecretCounts {
    pub total: usize,
    pub by_category: std::collections::HashMap<String, usize>,
    pub by_project: std::collections::HashMap<String, usize>,
    pub pinned: usize,
}
