use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, PhysicalPosition, Position, Rect, WebviewWindow, WindowEvent,
};

struct TrayState {
    last_blur_hide: Mutex<Option<Instant>>,
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

    // Default horizontal alignment: centered under/above tray icon
    let mut x = tray_pos.x + (tray_size.width / 2) - (win_w / 2);
    // Place below tray icon if tray is near the top (macOS / GNOME), otherwise above (Windows taskbar)
    let mut y = if tray_pos.y < 200 {
        tray_pos.y + tray_size.height + margin
    } else {
        tray_pos.y - win_h - margin
    };

    // Clamp to the monitor's work area so the popover never clips off-screen
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

    // Avoid immediately reopening if clicking the tray icon just triggered a focus-loss hide
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .manage(TrayState {
            last_blur_hide: Mutex::new(None),
        })
        .setup(|app| {
            let toggle_item =
                MenuItem::with_id(app, "toggle", "Show / Hide Rico", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit Rico", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle_item, &quit_item])?;

            let mut builder = TrayIconBuilder::with_id("rico-tray")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("Rico — Spend Monitor & Approvals")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let state = app.state::<TrayState>();
                            toggle_popover(&window, None, &state);
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
            if window.label() != "main" {
                return;
            }
            match event {
                WindowEvent::Focused(false) => {
                    if let Ok(mut guard) = window.state::<TrayState>().last_blur_hide.lock() {
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
