use super::CmdResult;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
pub fn greet(name: &str) -> CmdResult<String> {
    Ok(format!("Hello, {}! You've been greeted from Rust!!!", name))
}
