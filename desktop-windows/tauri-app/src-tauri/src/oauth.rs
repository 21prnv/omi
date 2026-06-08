//! Desktop Google sign-in via the loopback (RFC 8252) flow.
//!
//! Google blocks OAuth inside embedded webviews, and webviews block popups — so
//! the Mac app (and this one) run OAuth in the *system browser* against Omi's own
//! backend broker, not Google directly:
//!
//!   1. bind a one-shot HTTP server on http://localhost:<ephemeral>
//!   2. open the system browser to {API}/v1/auth/authorize?provider=google
//!      &redirect_uri=http://localhost:<port>/callback&state=<state>
//!   3. user signs in with Google in the real browser; backend redirects back to
//!      the loopback with ?code=...&state=...
//!   4. return the code to the UI, which exchanges it at {API}/v1/auth/token for a
//!      Firebase custom token and calls signInWithCustomToken.
//!
//! The backend whitelists http loopback redirect URIs (backend/routers/auth.py
//! _validate_redirect_uri), so no custom URL-scheme registration is needed.

use std::time::Duration;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

#[derive(serde::Serialize)]
pub struct OAuthResult {
    pub code: String,
    pub redirect_uri: String,
}

fn api_base() -> String {
    std::env::var("OMI_API_BASE_URL").unwrap_or_else(|_| "https://api.omi.me".to_string())
}

/// Run the loopback OAuth dance and return the authorization code. The UI then
/// exchanges it for a Firebase custom token. Times out after 5 minutes.
#[tauri::command]
pub async fn google_oauth_listen() -> Result<OAuthResult, String> {
    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| format!("bind loopback: {e}"))?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let redirect_uri = format!("http://localhost:{port}/callback");
    let state = uuid::Uuid::new_v4().to_string();

    let auth_url = format!(
        "{}/v1/auth/authorize?provider=google&redirect_uri={}&state={}",
        api_base(),
        urlencoding::encode(&redirect_uri),
        urlencoding::encode(&state),
    );
    open::that(&auth_url).map_err(|e| format!("open browser: {e}"))?;

    // Wait for the single browser redirect back to the loopback.
    let (mut stream, _) = tokio::time::timeout(Duration::from_secs(300), listener.accept())
        .await
        .map_err(|_| "sign-in timed out".to_string())?
        .map_err(|e| format!("accept: {e}"))?;

    let mut buf = vec![0u8; 8192];
    let n = stream.read(&mut buf).await.map_err(|e| e.to_string())?;
    let request = String::from_utf8_lossy(&buf[..n]);
    let target = request
        .lines()
        .next()
        .and_then(|l| l.split_whitespace().nth(1))
        .unwrap_or("");
    let query = target.split_once('?').map(|(_, q)| q).unwrap_or("");

    let (mut code, mut returned_state, mut err) = (None, None, None);
    for pair in query.split('&') {
        let (k, v) = pair.split_once('=').unwrap_or((pair, ""));
        let decoded = urlencoding::decode(v).map(|c| c.into_owned()).unwrap_or_default();
        match k {
            "code" => code = Some(decoded),
            "state" => returned_state = Some(decoded),
            "error" => err = Some(decoded),
            _ => {}
        }
    }

    let ok = err.is_none() && code.is_some() && returned_state.as_deref() == Some(state.as_str());
    let body = if ok {
        "<h2>Signed in to Omi</h2><p>You can close this window and return to the app.</p>"
    } else {
        "<h2>Sign-in failed</h2><p>You can close this window and try again.</p>"
    };
    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        body.len(),
        body
    );
    let _ = stream.write_all(response.as_bytes()).await;
    let _ = stream.flush().await;

    if let Some(e) = err {
        return Err(format!("oauth error: {e}"));
    }
    if returned_state.as_deref() != Some(state.as_str()) {
        return Err("state mismatch (possible CSRF)".into());
    }
    let code = code.ok_or("no authorization code in callback")?;
    Ok(OAuthResult { code, redirect_uri })
}
