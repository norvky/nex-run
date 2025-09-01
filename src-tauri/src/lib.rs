//! `tauri-app` —— Tauri 应用的主入口模块。
//!
//! 本模块负责 Tauri 应用的初始化、配置、插件注册、后端命令处理器注册以及主事件循环管理。
//! 它致力于提供一个清晰、模块化且易于维护的应用启动流程。

// 引入 Tauri 框架的核心类型和宏
use tauri::{generate_context, generate_handler, App, Builder, Result, RunEvent, Wry};
// 日志记录
use tauri_plugin_log::{Target, TargetKind};
// 引入 Tauri 插件：opener
use tauri_plugin_opener;

// 引入内部模块
mod cmd; // 包含所有后端命令（commands）的定义
mod utils; // 包含各种通用工具，例如日志功能

// =========================================================================
// 辅助函数集合：负责应用程序不同方面的配置和生命周期管理
// =========================================================================

/// 注册所有 Tauri 插件。
///
/// 此函数接受一个 `tauri::Builder<Wry>` 实例，并集中注册所有应用程序所需的 Tauri 插件。
/// 通过将插件注册逻辑封装在此处，能够清晰地管理应用程序的外部依赖和扩展功能，
/// 提高代码的可维护性和模块化程度。
///
/// # Arguments
///
/// * `builder_instance` - 当前的 Tauri 构建器实例，用于链式调用添加插件。
///
/// # Returns
///
/// 返回已注册所有插件的 `tauri::Builder<Wry>` 实例。
fn register_tauri_plugins(builder_instance: Builder<Wry>) -> Builder<Wry> {
    builder_instance
        // 注册 Tauri 官方的 `opener` 插件，用于在默认浏览器中打开外部链接。
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
}

/// 注册所有前端可调用的后端命令处理器。
///
/// 此函数接受一个 `tauri::Builder<Wry>` 实例，并使用 `tauri::generate_handler!` 宏
/// 统一注册所有由 Rust 后端 `cmd` 模块提供，并标记有 `#[tauri::command]` 属性的函数。
/// 这些函数构成了前端与后端之间进行数据交互和业务逻辑调用的主要接口。
///
/// # Arguments
///
/// * `builder_instance` - 当前的 Tauri 构建器实例，用于注册命令处理器。
///
/// # Returns
///
/// 返回已注册所有后端命令处理器的 `tauri::Builder<Wry>` 实例。
fn register_tauri_invoke_handlers(builder_instance: Builder<Wry>) -> Builder<Wry> {
    builder_instance.invoke_handler(generate_handler![
        // 注册 `cmd::app` 模块中的 `greet` 命令。
        cmd::app::greet,
        // 示例：未来可在此处注册来自不同模块的其他命令：
        // cmd::auth::login,      // 例如用户认证相关的登录命令
        // cmd::auth::logout,     // 例如用户认证相关的注销命令
        // cmd::data::fetch_item, // 例如数据获取命令
        // cmd::data::save_item,  // 例如数据保存命令
    ])
}

/// 配置 Tauri 构建器。
///
/// 此函数作为协调者，负责初始化一个默认的 Tauri 构建器，并调用更细粒度的辅助函数
/// 来注册所有必要的插件和后端命令处理器。它将构建流程的各个阶段清晰地组织起来，
/// 保持主入口函数的简洁性。
///
/// # Returns
///
/// 返回一个已完成基本配置（包括插件和命令注册）的 `tauri::Builder<Wry>` 实例。
fn configure_tauri_builder() -> Builder<Wry> {
    let builder = Builder::default();
    // 首先注册所有应用程序插件
    let builder = register_tauri_plugins(builder);
    // 然后注册所有前端可调用的后端命令处理器
    let builder = register_tauri_invoke_handlers(builder);

    builder
}

/// 构建 Tauri 应用程序实例。
///
/// 此函数接受一个配置好的 `tauri::Builder<Wry>` 实例，并尝试构建 `tauri::App<Wry>`。
/// 它利用 `tauri::generate_context!` 宏生成应用程序所需的上下文，
/// 并返回一个 `tauri::Result`，以优雅地处理构建过程中可能出现的错误。
///
/// # Arguments
///
/// * `builder_instance` - 已经过配置的 Tauri 构建器。
///
/// # Returns
///
/// 返回一个 `tauri::Result<tauri::App<Wry>>`，成功时包含 `tauri::App<Wry>` 实例，
/// 失败时包含一个错误。
fn build_tauri_application(builder_instance: Builder<Wry>) -> Result<App<Wry>> {
    builder_instance.build(generate_context!())
}

/// 运行 Tauri 应用程序的主事件循环。
///
/// 此函数启动 Tauri 应用程序的主事件循环，并在应用程序的整个生命周期中
/// 捕获并响应各种事件，如应用程序准备就绪 (`Ready`)、请求退出 (`ExitRequested`)
/// 和最终退出 (`Exit`)。
///
/// 在 `ExitRequested` 事件中，它通过 `api.prevent_exit()` 阻止默认的退出行为，
/// 允许开发者在应用程序退出前执行自定义逻辑（例如，弹出确认窗口）。
///
/// # Arguments
///
/// * `app` - 已构建的 Tauri 应用程序实例。
fn run_app_event_loop(app: App<Wry>) {
    app.run(move |_app_handle, event| match event {
        RunEvent::Ready | RunEvent::Resumed => {
            log::info!(target: "System", "Application is ready.");
        }
        RunEvent::ExitRequested { api, .. } => {
            // 阻止应用程序立即退出，允许执行自定义退出逻辑。
            api.prevent_exit();
            log::info!(target: "System", "Exit requested, preventing default exit.");
            // 可以在此处添加自定义的退出确认逻辑，例如向前端发送事件或显示对话框。
            // _app_handle.emit_all("ask_before_exit", ()) 或者 _app_handle.dialog().ask(...)
        }
        RunEvent::Exit => {
            log::info!(target: "System", "Application is exiting.");
        }
        _ => { /* 处理其他未明确处理的事件 */ }
    });
}

// =========================================================================
// 主入口函数：协调上述辅助函数的执行流程
// =========================================================================

/// Tauri 应用程序的入口点。
///
/// 此函数是 Tauri 应用程序启动的入口点，它负责协调应用程序的初始化、构建和运行过程。
/// 它依次调用配置构建器、构建应用程序实例和运行事件循环的辅助函数。
///
/// 使用 `tauri::Result<()>` 作为返回类型，允许在应用程序启动过程中的任何阶段
/// 优雅地处理和传播错误。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<()> {
    // 1. 配置 Tauri 构建器：注册所有插件和后端命令处理器。
    let builder = configure_tauri_builder();

    // 2. 构建 Tauri 应用程序实例。
    // 使用 `?` 操作符，如果构建失败 (返回 Err)，则立即从 `run` 函数返回该错误。
    let app = build_tauri_application(builder)?;

    // 3. 运行应用程序的主事件循环。
    run_app_event_loop(app);

    // 应用程序成功运行并最终退出，返回成功状态。
    Ok(())
}
