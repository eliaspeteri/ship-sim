# Tool System

## Purpose

Defines how editor tools are registered, activated, and shown in the tools panel.

## Scope

- Tool registry and metadata
- Hotkeys and activation
- Tool lifecycle (enter/exit)
- Tool UI bindings

## Out of Scope

- Specific tool behaviors

## Tool Definition

Each tool declares:

- `id`
- `label`
- `icon`
- `shortcut`
- `mode` (select/place/draw/etc)

## Implementation Checklist

- [ ] Central tool registry
- [ ] Keyboard shortcut handler
- [ ] Active tool state in editor context
- [ ] Tool enter/exit hooks
- [ ] UI panel reflects active tool
- [ ] Disabled state for tools without permissions
