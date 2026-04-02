// UFS Test Application - Main Entry
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ufs;
mod test_runner;
mod models;

use std::sync::Mutex;
use tauri::State;
use crate::models::{TestCase, TestResult, TestSuite, DeviceInfo};
use crate::test_runner::{TestRunner, TestStatus};
use crate::ufs::UFSInterface;

// 应用状态
pub struct AppState {
    test_runner: Mutex<TestRunner>,
    ufs_interface: Mutex<UFSInterface>,
}

#[tauri::command]
fn get_device_info(state: State<AppState>) -> Result<DeviceInfo, String> {
    let ufs = state.ufs_interface.lock().map_err(|e| e.to_string())?;
    ufs.get_device_info()
}

#[tauri::command]
fn list_available_tests() -> Vec<TestCase> {
    test_runner::get_available_tests()
}

#[tauri::command]
fn start_test(
    test_ids: Vec<String>,
    device_path: String,
    state: State<AppState>
) -> Result<String, String> {
    let mut runner = state.test_runner.lock().map_err(|e| e.to_string())?;
    let session_id = runner.start_tests(test_ids, device_path)?;
    Ok(session_id)
}

#[tauri::command]
fn stop_test(state: State<AppState>) -> Result<(), String> {
    let mut runner = state.test_runner.lock().map_err(|e| e.to_string())?;
    runner.stop_tests()
}

#[tauri::command]
fn get_test_status(state: State<AppState>) -> Result<TestStatus, String> {
    let runner = state.test_runner.lock().map_err(|e| e.to_string())?;
    Ok(runner.get_status())
}

#[tauri::command]
fn get_test_results(session_id: String, state: State<AppState>) -> Result<Vec<TestResult>, String> {
    let runner = state.test_runner.lock().map_err(|e| e.to_string())?;
    runner.get_results(&session_id)
}

#[tauri::command]
fn export_results(session_id: String, format: String, path: String, state: State<AppState>) -> Result<(), String> {
    let runner = state.test_runner.lock().map_err(|e| e.to_string())?;
    runner.export_results(&session_id, &format, &path)
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            test_runner: Mutex::new(TestRunner::new()),
            ufs_interface: Mutex::new(UFSInterface::new()),
        })
        .invoke_handler(tauri::generate_handler![
            get_device_info,
            list_available_tests,
            start_test,
            stop_test,
            get_test_status,
            get_test_results,
            export_results,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
