use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("마스터 패스워드가 올바르지 않습니다")]
    InvalidPassword,

    #[error("앱이 잠겨 있습니다. 먼저 잠금을 해제하세요")]
    AppLocked,

    #[error("이미 설정이 완료되었습니다")]
    AlreadySetup,

    #[error("시크릿을 찾을 수 없습니다: {0}")]
    SecretNotFound(String),

    #[error("카테고리를 찾을 수 없습니다: {0}")]
    CategoryNotFound(String),

    #[error("이미 존재하는 카테고리입니다: {0}")]
    CategoryDuplicate(String),

    #[error("프로젝트를 찾을 수 없습니다: {0}")]
    ProjectNotFound(String),

    #[error("이미 존재하는 프로젝트입니다: {0}")]
    ProjectDuplicate(String),

    #[error("암호화 오류: {0}")]
    CryptoError(String),

    #[error("데이터베이스 오류: {0}")]
    DatabaseError(String),

    #[error("내보내기/가져오기 오류: {0}")]
    ExportError(String),

    #[error("패스워드는 8자 이상이어야 합니다")]
    PasswordTooShort,
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_str())
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        AppError::DatabaseError(e.to_string())
    }
}
