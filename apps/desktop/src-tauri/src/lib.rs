mod keyring_auth;

use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, PhysicalPosition, Position, Rect, WebviewWindow, WindowEvent,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt as AutostartManagerExt};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

struct TrayState {
    last_blur_hide: Mutex<Option<Instant>>,
    last_launcher_blur_hide: Mutex<Option<Instant>>,
}

fn position_window_near_tray(window: &WebviewWindow, tray_rect: Rect) {
    let Ok(win_size) = window.outer_size() else {
        return;
    };

    let scale = window.scale_factor().unwrap_or(1.0);
    let tray_pos = tray_rect.position.to_physical::<i32>(scale);
    let tray_size = tray_rect.size.to_physical::<i32>(scale);

    let win_w = win_size.width as i32;
    let win_h = win_size.height as i32;
    let margin = (8.0 * scale) as i32;

    let mut x = tray_pos.x + (tray_size.width / 2) - (win_w / 2);
    let mut y = if tray_pos.y < 200 {
        tray_pos.y + tray_size.height + margin
    } else {
        tray_pos.y - win_h - margin
    };

    if let Ok(Some(monitor)) = window.current_monitor() {
        let mon_pos = monitor.position();
        let mon_size = monitor.size();
        let min_x = mon_pos.x + margin;
        let max_x = mon_pos.x + mon_size.width as i32 - win_w - margin;
        let min_y = mon_pos.y + margin;
        let max_y = mon_pos.y + mon_size.height as i32 - win_h - margin;

        x = x.clamp(min_x, max_x.max(min_x));
        y = y.clamp(min_y, max_y.max(min_y));
    }

    let _ = window.set_position(Position::Physical(PhysicalPosition::new(x, y)));
}

fn toggle_popover(window: &WebviewWindow, tray_rect: Option<Rect>, state: &TrayState) {
    let is_visible = window.is_visible().unwrap_or(false);
    if is_visible {
        let _ = window.hide();
        return;
    }

    if let Ok(guard) = state.last_blur_hide.lock() {
        if let Some(ts) = *guard {
            if ts.elapsed() < Duration::from_millis(250) {
                return;
            }
        }
    }

    if let Some(rect) = tray_rect {
        position_window_near_tray(window, rect);
    }

    let _ = window.show();
    let _ = window.set_focus();
}

fn toggle_launcher(app: &AppHandle) {
    let Some(launcher) = app.get_webview_window("launcher") else {
        return;
    };

    let state = app.state::<TrayState>();
    let is_visible = launcher.is_visible().unwrap_or(false);
    if is_visible {
        let _ = launcher.hide();
        return;
    }

    if let Ok(guard) = state.last_launcher_blur_hide.lock() {
        if let Some(ts) = *guard {
            if ts.elapsed() < Duration::from_millis(180) {
                return;
            }
        }
    }

    let _ = launcher.center();
    let _ = launcher.show();
    let _ = launcher.set_focus();
    let _ = launcher.emit("launcher:opened", ());
}

#[tauri::command]
fn open_command_launcher(app: AppHandle) {
    toggle_launcher(&app);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let start_minimized = std::env::args().any(|arg| arg == "--minimized");

    let shortcut = Shortcut::new(
        Some(Modifiers::SUPER | Modifiers::SHIFT),
        Code::KeyR,
    );
    let ctrl_shortcut = Shortcut::new(
        Some(Modifiers::CONTROL | Modifiers::SHIFT),
        Code::KeyR,
    );

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, pressed, event| {
                    if event.state == ShortcutState::Pressed
                        && (pressed == &shortcut || pressed == &ctrl_shortcut)
                    {
                        toggle_launcher(app);
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            keyring_auth::keyring_save_session,
            keyring_auth::keyring_load_session,
            keyring_auth::keyring_clear_session,
            open_command_launcher,
        ])
        .manage(TrayState {
            last_blur_hide: Mutex::new(None),
            last_launcher_blur_hide: Mutex::new(None),
        })
        .setup(move |app| {
            // Keep macOS running quietly as a menu-bar agent without a Dock icon
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Hide popover on OS login autostart (--minimized)
            if start_minimized {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }

            let target_shortcut = if cfg!(target_os = "macos") {
                shortcut
            } else {
                ctrl_shortcut
            };
            if let Err(err) = app.global_shortcut().register(target_shortcut) {
                eprintln!("[Rico Desktop] Could not register global shortcut: {err}");
            }

            let launcher_label = if cfg!(target_os = "macos") {
                "Command Launcher (Cmd+Shift+R)"
            } else {
                "Command Launcher (Ctrl+Shift+R)"
            };

            let autostart_enabled = app.autolaunch().is_enabled().unwrap_or(false);

            let toggle_item =
                MenuItem::with_id(app, "toggle", "Show / Hide Rico", true, None::<&str>)?;
            let launcher_item =
                MenuItem::with_id(app, "launcher", launcher_label, true, None::<&str>)?;
            let autostart_item = CheckMenuItem::with_id(
                app,
                "autostart",
                "Launch Rico on Login",
                true,
                autostart_enabled,
                None::<&str>,
            )?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit Rico", true, None::<&str>)?;
            let menu = Menu::with_items(
                app,
                &[
                    &toggle_item,
                    &launcher_item,
                    &autostart_item,
                    &separator,
                    &quit_item,
                ],
            )?;

            let autostart_item_handle = autostart_item.clone();

            let mut builder = TrayIconBuilder::with_id("rico-tray")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("Rico — Spend Monitor & Command Launcher")
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "toggle" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let state = app.state::<TrayState>();
                            toggle_popover(&window, None, &state);
                        }
                    }
                    "launcher" => {
                        toggle_launcher(app);
                    }
                    "autostart" => {
                        let currently_enabled = app.autolaunch().is_enabled().unwrap_or(false);
                        let res = if currently_enabled {
                            app.autolaunch().disable()
                        } else {
                            app.autolaunch().enable()
                        };
                        if res.is_ok() {
                            let _ = autostart_item_handle.set_checked(!currently_enabled);
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        rect,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let state = app.state::<TrayState>();
                            toggle_popover(&window, Some(rect), &state);
                        }
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                builder = builder.icon(icon.clone());
            }

            builder.build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            let label = window.label();
            if label != "main" && label != "launcher" {
                return;
            }
            match event {
                WindowEvent::Focused(false) => {
                    let state = window.state::<TrayState>();
                    if label == "launcher" {
                        if let Ok(mut guard) = state.last_launcher_blur_hide.lock() {
                            *guard = Some(Instant::now());
                        }
                    } else if let Ok(mut guard) = state.last_blur_hide.lock() {
                        *guard = Some(Instant::now());
                    }
                    let _ = window.hide();
                }
                WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    let _ = window.hide();
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
