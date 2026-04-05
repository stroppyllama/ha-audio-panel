# Home Audio Card

A custom Lovelace card for Home Assistant providing full-featured audio control with Music Assistant, Spotify, Plex, and multi-room Sonos.

## Features

- **Full-screen album artwork** with blurred background
- **Room switching** via bottom tab bar (Kitchen, Basement, Closet, Hallway)
- **Play/pause/skip/shuffle/repeat** controls
- **Per-room volume** control
- **Browse & Search** — Spotify and Plex via Music Assistant
- **"Play in room" picker** — browse globally, choose where to play
- **Queue viewer** with track list
- **Group controls** — Whole House, Ungroup, Stop All
- **Vinyl/Line-in toggle** for Basement record player

## Requirements

- [Music Assistant](https://music-assistant.io/) with Spotify and/or Plex providers
- Sonos speakers configured in HA

## Installation via HACS

1. In HACS go to **Frontend** → **⋮** → **Custom repositories**
2. Add your repo URL with category **Lovelace**
3. Install **Home Audio Card**
4. Add to `configuration.yaml`:

```yaml
frontend:
  extra_module_url:
    - /hacsfiles/ha-audio-card/ha-audio-card.js
```

5. Restart Home Assistant

## Usage

Add to your Lovelace dashboard in panel mode:

```yaml
views:
  - type: panel
    path: audio
    title: Home Audio
    kiosk_mode:
      mobile_settings:
        hide_header: true
      ignore_entity_settings: true
    cards:
      - type: custom:ha-audio-card
```

## Configuration

Edit `ha-audio-card.js` and update the `ROOMS` array at the top to match your speaker entity IDs:

```javascript
const ROOMS = [
  { id: 'kitchen',  label: 'Kitchen',  sonos: 'media_player.YOUR_SONOS', mass: 'media_player.YOUR_MA_ENTITY', hasLineIn: false },
  ...
]
```
