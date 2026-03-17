use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub order: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateCategoryInput {
    pub name: String,
    pub icon: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCategoryInput {
    pub id: String,
    pub name: Option<String>,
    pub icon: Option<String>,
}
