use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize, Clone)]
pub struct LayerResponse {
    pub id: String,
    pub name: String,
    pub visible: bool,
    pub locked: bool,
    pub order: u32,
}

#[derive(Debug, Serialize)]
pub struct CommandResponse {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
pub fn create_layer(name: String) -> LayerResponse {
    LayerResponse {
        id: Uuid::new_v4().to_string(),
        name,
        visible: true,
        locked: false,
        order: 0,
    }
}

#[tauri::command]
pub fn rename_layer(id: String, name: String) -> LayerResponse {
    LayerResponse {
        id,
        name,
        visible: true,
        locked: false,
        order: 0,
    }
}

#[tauri::command]
pub fn toggle_layer_visibility(id: String, visible: bool) -> LayerResponse {
    LayerResponse {
        id,
        name: String::new(),
        visible,
        locked: false,
        order: 0,
    }
}

#[tauri::command]
pub fn delete_layer(id: String) -> CommandResponse {
    if id.is_empty() {
        CommandResponse {
            success: false,
            message: "Layer id must not be empty".to_string(),
        }
    } else {
        CommandResponse {
            success: true,
            message: format!("Layer {} deleted", id),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_layer_returns_unique_ids() {
        let a = create_layer("Background".to_string());
        let b = create_layer("Foreground".to_string());
        assert_ne!(a.id, b.id, "each layer must have a unique id");
    }

    #[test]
    fn test_create_layer_defaults() {
        let layer = create_layer("Sketch".to_string());
        assert_eq!(layer.name, "Sketch");
        assert!(layer.visible, "new layer should be visible by default");
        assert!(!layer.locked, "new layer should not be locked by default");
        // id must be a valid UUID v4
        assert!(
            uuid::Uuid::parse_str(&layer.id).is_ok(),
            "id must be a valid UUID"
        );
    }

    #[test]
    fn test_rename_layer_preserves_id() {
        let id = "abc-123".to_string();
        let layer = rename_layer(id.clone(), "New Name".to_string());
        assert_eq!(layer.id, id);
        assert_eq!(layer.name, "New Name");
    }

    #[test]
    fn test_toggle_layer_visibility() {
        let id = "layer-42".to_string();
        let hidden = toggle_layer_visibility(id.clone(), false);
        assert!(!hidden.visible);
        assert_eq!(hidden.id, id);

        let visible = toggle_layer_visibility(id.clone(), true);
        assert!(visible.visible);
    }

    #[test]
    fn test_delete_layer_success() {
        let resp = delete_layer("layer-99".to_string());
        assert!(resp.success);
        assert!(resp.message.contains("layer-99"));
    }

    #[test]
    fn test_delete_layer_empty_id_fails() {
        let resp = delete_layer(String::new());
        assert!(!resp.success);
    }
}
