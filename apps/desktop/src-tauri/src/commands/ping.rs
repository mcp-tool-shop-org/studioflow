use serde::Serialize;

#[derive(Serialize)]
pub struct PingResponse {
    pub pong: bool,
    pub message: String,
    pub timestamp: String,
}

#[tauri::command]
pub fn ping(message: Option<String>) -> PingResponse {
    PingResponse {
        pong: true,
        message: message.unwrap_or_else(|| "pong".to_string()),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_ping_default() {
        let r = ping(None);
        assert!(r.pong);
        assert_eq!(r.message, "pong");
    }
    #[test]
    fn test_ping_with_message() {
        let r = ping(Some("hello".into()));
        assert!(r.pong);
        assert_eq!(r.message, "hello");
    }
}
