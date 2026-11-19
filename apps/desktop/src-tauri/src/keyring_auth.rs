use keyring::Entry;
use serde::{Deserialize, Serialize};

const KEYRING_SERVICE: &str = "ai.rico.desktop";
const KEYRING_ACCOUNT: &str = "active-session";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct KeyringSession {
    pub server_url: String,
    pub email: String,
    pub cookie_header: String,
}

#[tauri::command]
pub fn keyring_save_session(session: KeyringSession) -> Result<(), String> {
    let payload = serde_json::to_string(&session)
        .map_err(|e| format!("Failed to serialize keyring session: {e}"))?;
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)
        .map_err(|e| format!("Failed to open OS keyring entry: {e}"))?;
    entry
        .set_password(&payload)
        .map_err(|e| format!("Failed to store session in OS keyring: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn keyring_load_session() -> Result<Option<KeyringSession>, String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)
        .map_err(|e| format!("Failed to open OS keyring entry: {e}"))?;
    match entry.get_password() {
        Ok(raw) => {
            let parsed: KeyringSession = serde_json::from_str(&raw)
                .map_err(|e| format!("Corrupt keyring session payload: {e}"))?;
            Ok(Some(parsed))
        }
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("Failed to read session from OS keyring: {e}")),
    }
}

#[tauri::command]
pub fn keyring_clear_session() -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)
        .map_err(|e| format!("Failed to open OS keyring entry: {e}"))?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(format!("Failed to clear OS keyring entry: {e}")),
    }
}

#[cfg(test)]
mod tests {
    use super::KeyringSession;

    #[test]
    fn roundtrips_keyring_session_json() {
        let session = KeyringSession {
            server_url: "http://localhost:3000".to_string(),
            email: "judge@paypal-hackathon.ai".to_string(),
            cookie_header: "rico_auth_session=abc.123".to_string(),
        };
        let encoded = serde_json::to_string(&session).expect("serialize");
        let decoded: KeyringSession = serde_json::from_str(&encoded).expect("deserialize");
        assert_eq!(decoded, session);
    }
}
