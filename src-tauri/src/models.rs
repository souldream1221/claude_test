use serde::{Deserialize, Serialize};
use chrono::{DateTime, Local};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub path: String,
    pub model: String,
    pub serial: String,
    pub firmware_version: String,
    pub capacity_gb: u64,
    pub health_percent: u8,
    pub temperature_celsius: i8,
    pub is_connected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestCase {
    pub id: String,
    pub name: String,
    pub category: TestCategory,
    pub description: String,
    pub duration_estimate_sec: u32,
    pub parameters: Vec<TestParameter>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TestCategory {
    Read,
    Write,
    Erase,
    Performance,
    Stability,
    Protocol,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestParameter {
    pub name: String,
    pub param_type: ParameterType,
    pub default_value: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ParameterType {
    Integer { min: i64, max: i64 },
    Float { min: f64, max: f64 },
    String,
    Boolean,
    Enum { options: Vec<String> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestSuite {
    pub id: String,
    pub name: String,
    pub test_cases: Vec<String>,
    pub created_at: DateTime<Local>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResult {
    pub session_id: String,
    pub test_id: String,
    pub test_name: String,
    pub status: TestResultStatus,
    pub start_time: DateTime<Local>,
    pub end_time: Option<DateTime<Local>>,
    pub duration_ms: u64,
    pub message: String,
    pub metrics: Vec<TestMetric>,
    pub logs: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TestResultStatus {
    Pending,
    Running,
    Passed,
    Failed,
    Error,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestMetric {
    pub name: String,
    pub value: f64,
    pub unit: String,
    pub threshold: Option<f64>,
}

// 性能测试特有的指标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub sequential_read_mbps: f64,
    pub sequential_write_mbps: f64,
    pub random_read_iops: u32,
    pub random_write_iops: u32,
    pub read_latency_us: f64,
    pub write_latency_us: f64,
}
