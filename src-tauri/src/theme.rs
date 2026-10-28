use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::plugin::{Builder, TauriPlugin};
use tauri::{AppHandle, Manager, Runtime};

#[derive(Serialize, Deserialize)]
pub struct SystemTheme {
    dark: bool,
    colors: HashMap<String, String>,
}

pub struct ThemeBridge<R: Runtime> {
    #[cfg(target_os = "android")]
    handle: tauri::plugin::PluginHandle<R>,
    #[cfg(not(target_os = "android"))]
    _marker: std::marker::PhantomData<fn() -> R>,
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("theme")
        .setup(|app, api| {
            #[cfg(target_os = "android")]
            let handle = api.register_android_plugin(
                "com.brunorochamoura.frictiontimer.theme",
                "ThemePlugin",
            )?;
            #[cfg(not(target_os = "android"))]
            let _ = api;
            app.manage(ThemeBridge::<R> {
                #[cfg(target_os = "android")]
                handle,
                #[cfg(not(target_os = "android"))]
                _marker: std::marker::PhantomData,
            });
            Ok(())
        })
        .build()
}

#[tauri::command]
pub fn get_system_theme<R: Runtime>(app: AppHandle<R>) -> Result<Option<SystemTheme>, String> {
    let bridge = app.state::<ThemeBridge<R>>();
    #[cfg(target_os = "android")]
    {
        bridge
            .handle
            .run_mobile_plugin("getTheme", ())
            .map_err(|err| err.to_string())
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = bridge;
        Ok(None)
    }
}
