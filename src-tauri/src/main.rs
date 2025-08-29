// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Result;

fn main() -> Result<()> {
    nex_run_lib::run()?;

    Ok(())
}
