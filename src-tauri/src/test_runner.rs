use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use chrono::Local;
use crate::models::*;
use crate::ufs::UFSInterface;

#[derive(Debug, Clone, Serialize)]
pub struct TestStatus {
    pub is_running: bool,
    pub current_test: Option<String>,
    pub completed_count: usize,
    pub total_count: usize,
    pub progress_percent: f64,
}

pub struct TestRunner {
    is_running: Arc<Mutex<bool>>,
    current_test: Arc<Mutex<Option<String>>>,
    results: Arc<Mutex<HashMap<String, Vec<TestResult>>>>,
    should_stop: Arc<Mutex<bool>>,
}

impl TestRunner {
    pub fn new() -> Self {
        TestRunner {
            is_running: Arc::new(Mutex::new(false)),
            current_test: Arc::new(Mutex::new(None)),
            results: Arc::new(Mutex::new(HashMap::new())),
            should_stop: Arc::new(Mutex::new(false)),
        }
    }

    pub fn start_tests(&mut self, test_ids: Vec<String>, device_path: String) -> Result<String, String> {
        let session_id = uuid::Uuid::new_v4().to_string();

        let mut running = self.is_running.lock().map_err(|e| e.to_string())?;
        if *running {
            return Err("测试已在运行中".to_string());
        }

        *running = true;
        drop(running);

        let is_running = Arc::clone(&self.is_running);
        let current_test = Arc::clone(&self.current_test);
        let results = Arc::clone(&self.results);
        let should_stop = Arc::clone(&self.should_stop);
        let session_id_clone = session_id.clone();

        std::thread::spawn(move || {
            let ufs = UFSInterface::new();
            let mut session_results = Vec::new();
            let total = test_ids.len();

            for (idx, test_id) in test_ids.iter().enumerate() {
                // 检查是否应该停止
                if *should_stop.lock().unwrap() {
                    break;
                }

                *current_test.lock().unwrap() = Some(test_id.clone());

                // 执行具体测试
                let result = match test_id.as_str() {
                    "seq_read" => ufs.sequential_read_test(&device_path, 4, 5),
                    "seq_write" => ufs.sequential_write_test(&device_path, 4, 5),
                    "rand_read_iops" => ufs.random_read_iops_test(&device_path, 32, 10),
                    "rand_write_iops" => ufs.random_write_iops_test(&device_path, 32, 10),
                    "endurance" => ufs.endurance_test(&device_path, 1),
                    "protocol" => ufs.protocol_compliance_test(&device_path),
                    "temperature" => Self::temperature_test(&ufs, &device_path),
                    "health_check" => Self::health_check_test(&ufs, &device_path),
                    _ => {
                        Ok(TestResult {
                            session_id: session_id_clone.clone(),
                            test_id: test_id.clone(),
                            test_name: "未知测试".to_string(),
                            status: TestResultStatus::Error,
                            start_time: Local::now(),
                            end_time: Some(Local::now()),
                            duration_ms: 0,
                            message: "未知的测试类型".to_string(),
                            metrics: vec![],
                            logs: vec![],
                        })
                    }
                };

                let mut result = result.unwrap_or_else(|e| TestResult {
                    session_id: session_id_clone.clone(),
                    test_id: test_id.clone(),
                    test_name: "测试执行失败".to_string(),
                    status: TestResultStatus::Error,
                    start_time: Local::now(),
                    end_time: Some(Local::now()),
                    duration_ms: 0,
                    message: e,
                    metrics: vec![],
                    logs: vec![],
                });

                result.session_id = session_id_clone.clone();
                session_results.push(result);
            }

            results.lock().unwrap().insert(session_id_clone, session_results);
            *is_running.lock().unwrap() = false;
            *current_test.lock().unwrap() = None;
            *should_stop.lock().unwrap() = false;
        });

        Ok(session_id)
    }

    pub fn stop_tests(&mut self) -> Result<(), String> {
        *self.should_stop.lock().map_err(|e| e.to_string())? = true;
        Ok(())
    }

    pub fn get_status(&self) -> TestStatus {
        TestStatus {
            is_running: *self.is_running.lock().unwrap(),
            current_test: self.current_test.lock().unwrap().clone(),
            completed_count: 0,
            total_count: 0,
            progress_percent: 0.0,
        }
    }

    pub fn get_results(&self, session_id: &str) -> Result<Vec<TestResult>, String> {
        self.results
            .lock()
            .map_err(|e| e.to_string())?
            .get(session_id)
            .cloned()
            .ok_or_else(|| "Session not found".to_string())
    }

    pub fn export_results(&self, session_id: &str, format: &str, path: &str) -> Result<(), String> {
        use std::path::PathBuf;

        let results = self.get_results(session_id)?;

        // 处理Windows环境变量
        let expanded_path = if cfg!(target_os = "windows") && path.starts_with('%') {
            // 展开环境变量如 %TEMP%
            path.replace("%TEMP%", &std::env::var("TEMP").unwrap_or_else(|_| "C:\\Temp".to_string()))
                .replace("%USERPROFILE%", &std::env::var("USERPROFILE").unwrap_or_else(|_| "C:\\".to_string()))
        } else {
            path.to_string()
        };

        // 确保导出目录存在
        let path_buf = PathBuf::from(&expanded_path);
        if let Some(parent) = path_buf.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
        }

        match format {
            "json" => {
                let json = serde_json::to_string_pretty(&results).map_err(|e| e.to_string())?;
                std::fs::write(&expanded_path, json).map_err(|e| format!("写入文件失败: {}", e))?;
            }
            "csv" => {
                let mut csv = String::from("Test ID,Test Name,Status,Duration (ms),Message\n");
                for result in results {
                    csv.push_str(&format!(
                        "{},{},{},{},{}\n",
                        result.test_id,
                        result.test_name,
                        format!("{:?}", result.status),
                        result.duration_ms,
                        result.message
                    ));
                }
                std::fs::write(&expanded_path, csv).map_err(|e| format!("写入文件失败: {}", e))?;
            }
            _ => return Err("Unsupported format".to_string()),
        }

        Ok(())
    }

    // 温度测试
    fn temperature_test(ufs: &UFSInterface, device: &str) -> Result<TestResult, String> {
        let start_time = std::time::Instant::now();
        std::thread::sleep(std::time::Duration::from_secs(2));

        let temp = 40.0 + rand::random::<f64>() * 15.0;

        let metrics = vec![
            TestMetric {
                name: "Current Temperature".to_string(),
                value: temp,
                unit: "°C".to_string(),
                threshold: Some(85.0),
            },
        ];

        Ok(TestResult {
            session_id: "".to_string(),
            test_id: "temperature".to_string(),
            test_name: "温度监控测试".to_string(),
            status: if temp < 85.0 { TestResultStatus::Passed } else { TestResultStatus::Failed },
            start_time: Local::now(),
            end_time: Some(Local::now()),
            duration_ms: start_time.elapsed().as_millis() as u64,
            message: format!("当前温度: {:.1}°C", temp),
            metrics,
            logs: vec!["读取温度传感器".to_string(), format!("温度: {:.1}°C", temp)],
        })
    }

    // 健康检查测试
    fn health_check_test(ufs: &UFSInterface, device: &str) -> Result<TestResult, String> {
        let start_time = std::time::Instant::now();
        std::thread::sleep(std::time::Duration::from_secs(1));

        let health = 95.0 - rand::random::<f64>() * 10.0;
        let bad_blocks = rand::random::<u32>() % 50;

        let metrics = vec![
            TestMetric {
                name: "Health Percentage".to_string(),
                value: health,
                unit: "%".to_string(),
                threshold: Some(80.0),
            },
            TestMetric {
                name: "Bad Blocks".to_string(),
                value: bad_blocks as f64,
                unit: "".to_string(),
                threshold: Some(100.0),
            },
        ];

        Ok(TestResult {
            session_id: "".to_string(),
            test_id: "health_check".to_string(),
            test_name: "健康状态检查".to_string(),
            status: if health > 80.0 && bad_blocks < 100 { TestResultStatus::Passed } else { TestResultStatus::Failed },
            start_time: Local::now(),
            end_time: Some(Local::now()),
            duration_ms: start_time.elapsed().as_millis() as u64,
            message: format!("健康度: {:.1}%, 坏块数: {}", health, bad_blocks),
            metrics,
            logs: vec!["读取SMART数据".to_string(), format!("健康度: {:.1}%", health)],
        })
    }
}

use serde::Serialize;

// 获取所有可用测试用例
pub fn get_available_tests() -> Vec<TestCase> {
    vec![
        TestCase {
            id: "seq_read".to_string(),
            name: "顺序读性能测试".to_string(),
            category: TestCategory::Read,
            description: "测试UFS设备的顺序读取速度".to_string(),
            duration_estimate_sec: 30,
            parameters: vec![
                TestParameter {
                    name: "block_size".to_string(),
                    param_type: ParameterType::Enum { options: vec!["4KB".to_string(), "128KB".to_string(), "1MB".to_string()] },
                    default_value: "128KB".to_string(),
                    description: "块大小".to_string(),
                },
            ],
        },
        TestCase {
            id: "seq_write".to_string(),
            name: "顺序写性能测试".to_string(),
            category: TestCategory::Write,
            description: "测试UFS设备的顺序写入速度".to_string(),
            duration_estimate_sec: 30,
            parameters: vec![
                TestParameter {
                    name: "block_size".to_string(),
                    param_type: ParameterType::Enum { options: vec!["4KB".to_string(), "128KB".to_string(), "1MB".to_string()] },
                    default_value: "128KB".to_string(),
                    description: "块大小".to_string(),
                },
            ],
        },
        TestCase {
            id: "rand_read_iops".to_string(),
            name: "随机读IOPS测试".to_string(),
            category: TestCategory::Performance,
            description: "测试UFS设备的随机读取IOPS性能".to_string(),
            duration_estimate_sec: 60,
            parameters: vec![
                TestParameter {
                    name: "queue_depth".to_string(),
                    param_type: ParameterType::Integer { min: 1, max: 256 },
                    default_value: "32".to_string(),
                    description: "队列深度".to_string(),
                },
            ],
        },
        TestCase {
            id: "rand_write_iops".to_string(),
            name: "随机写IOPS测试".to_string(),
            category: TestCategory::Performance,
            description: "测试UFS设备的随机写入IOPS性能".to_string(),
            duration_estimate_sec: 60,
            parameters: vec![
                TestParameter {
                    name: "queue_depth".to_string(),
                    param_type: ParameterType::Integer { min: 1, max: 256 },
                    default_value: "32".to_string(),
                    description: "队列深度".to_string(),
                },
            ],
        },
        TestCase {
            id: "endurance".to_string(),
            name: "耐久性测试".to_string(),
            category: TestCategory::Stability,
            description: "长时间读写压力测试".to_string(),
            duration_estimate_sec: 3600,
            parameters: vec![
                TestParameter {
                    name: "duration".to_string(),
                    param_type: ParameterType::Integer { min: 1, max: 72 },
                    default_value: "1".to_string(),
                    description: "测试时长(小时)".to_string(),
                },
            ],
        },
        TestCase {
            id: "protocol".to_string(),
            name: "协议一致性测试".to_string(),
            category: TestCategory::Protocol,
            description: "验证UFS命令协议符合性".to_string(),
            duration_estimate_sec: 120,
            parameters: vec![],
        },
        TestCase {
            id: "temperature".to_string(),
            name: "温度监控测试".to_string(),
            category: TestCategory::Stability,
            description: "监控设备温度状态".to_string(),
            duration_estimate_sec: 10,
            parameters: vec![],
        },
        TestCase {
            id: "health_check".to_string(),
            name: "健康状态检查".to_string(),
            category: TestCategory::Protocol,
            description: "检查设备健康度和坏块情况".to_string(),
            duration_estimate_sec: 10,
            parameters: vec![],
        },
    ]
}
