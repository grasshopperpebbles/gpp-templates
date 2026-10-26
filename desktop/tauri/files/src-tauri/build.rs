fn main() {
    // Listing the app's commands makes Tauri generate an `allow-<command>` permission for each;
    // a window can then call a command only when capabilities/default.json grants it.
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "read_file",
            "write_file",
            "list_directory",
            "run_command",
            "store_credential",
            "get_credential",
            "delete_credential",
        ]),
    ))
    .expect("failed to run tauri-build");
}
