/**
 * ha-audio-card.js - Home Audio Card for Home Assistant
 * GitHub: https://github.com/stroppyllama/ha-audio-panel
 */

const ROOMS = [
  { id: 'kitchen',  label: 'Kitchen',  sonos: 'media_player.sonos_move',    mass: 'media_player.kitchen',          hasLineIn: false },
  { id: 'basement', label: 'Basement', sonos: 'media_player.basement_fives', mass: 'media_player.basement',         hasLineIn: true  },
  { id: 'closet',   label: 'Closet',   sonos: 'media_player.closet',         mass: 'media_player.closet_2',         hasLineIn: false },
  { id: 'hallway',  label: 'Hallway',  sonos: 'media_player.move_2',         mass: 'media_player.upstairs_hallway', hasLineIn: false },
]
const ALL_SONOS = ROOMS.map(r => r.sonos)
const MASTER    = ROOMS[0].sonos

const haptic = (s = 'light') => {
  if ('vibrate' in navigator) navigator.vibrate({ light:[8], medium:[15], heavy:[25,8,25] }[s] || [8])
}

const svg = (d, sz = 24) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="currentColor"><path d="${d}"/></svg>`
const I = {
  play:    () => svg('M8 5v14l11-7z'),
  pause:   () => svg('M6 19h4V5H6v14zm8-14v14h4V5h-4z'),
  prev:    () => svg('M6 6h2v12H6zm3.5 6 8.5 6V6z'),
  next:    () => svg('M6 18l8.5-6L6 6v12zM16 6h2v12h-2z'),
  shuffle: () => svg('M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z'),
  repeat:  () => svg('M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z'),
  repeat1: () => svg('M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z'),
  queue:   () => svg('M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z'),
  search:  () => svg('M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'),
  browse:  () => svg('M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z'),
  volLo:   () => svg('M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z', 18),
  volHi:   () => svg('M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z', 18),
  group:   () => svg('M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'),
  back:    () => svg('M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z'),
  vinyl:   () => svg('M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z'),
  note:    () => svg('M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'),
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :host { display: block; height: 100vh; height: 100dvh; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent; user-select: none; color: #fff; }
  button { font-family: inherit; cursor: pointer; border: none; outline: none; background: none; color: inherit; -webkit-tap-highlight-color: transparent; }
  input { font-family: inherit; -webkit-tap-highlight-color: transparent; }
  input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; outline: none; cursor: pointer; width: 100%; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.4); transition: transform 0.15s; }
  input[type=range]:active::-webkit-slider-thumb { transform: scale(1.25); }
  ::-webkit-scrollbar { display: none; }

  .app { position: relative; width: 100%; height: 100vh; height: 100dvh; overflow: hidden; background: #080808; }
  .bg { position: absolute; inset: -30px; z-index: 0; background-size: cover; background-position: center; filter: blur(50px) saturate(200%) brightness(0.28); transform: scale(1.1); transition: opacity 0.7s ease; }
  .bg-fade { opacity: 0; }
  .bg-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.94) 100%); }

  .content { position: relative; z-index: 2; height: calc(100vh - 62px - env(safe-area-inset-bottom, 0px)); height: calc(100dvh - 62px - env(safe-area-inset-bottom, 0px)); display: flex; flex-direction: column; align-items: center; overflow: hidden; }
  .view { width: 100%; max-width: 440px; height: 100%; overflow-y: auto; padding: 16px 26px 16px; display: flex; flex-direction: column; }
  .browse-view { padding-top: 16px; }

  .view-tabs { display: flex; gap: 0; margin-bottom: 12px; flex-shrink: 0; background: rgba(255,255,255,0.06); border-radius: 10px; padding: 3px; }
  .vtab { flex: 1; padding: 7px 0; border-radius: 8px; font-size: 12px; font-weight: 600; letter-spacing: 0.03em; color: rgba(255,255,255,0.4); transition: all 0.18s; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .vtab.active { background: rgba(255,255,255,0.12); color: #fff; }

  .np-label { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.38); text-align: center; margin-bottom: 12px; flex-shrink: 0; }
  .art-wrap { width: 100%; max-height: 38vh; aspect-ratio: 1/1; border-radius: 16px; overflow: hidden; background: rgba(255,255,255,0.05); box-shadow: 0 28px 80px rgba(0,0,0,0.65), 0 8px 20px rgba(0,0,0,0.4); margin-bottom: 16px; flex-shrink: 0; align-self: center; }
  .art-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .art-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.12); }
  .art-placeholder svg { width: 64px; height: 64px; }

  .linein-banner { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 14px; margin-bottom: 14px; background: rgba(255,200,60,0.1); border: 1px solid rgba(255,200,60,0.25); flex-shrink: 0; }
  .linein-info { display: flex; align-items: center; gap: 10px; }
  .linein-dot { width: 8px; height: 8px; border-radius: 50%; background: #ffc83c; flex-shrink: 0; animation: pulse 2s infinite; }
  .linein-text { font-size: 13px; font-weight: 600; color: #ffc83c; }
  .linein-sub { font-size: 11px; color: rgba(255,200,60,0.6); margin-top: 1px; }
  .linein-btn { font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 8px; background: rgba(255,200,60,0.15); border: 1px solid rgba(255,200,60,0.3); color: #ffc83c; }
  .vinyl-toggle { display: flex; align-items: center; justify-content: space-between; padding: 11px 16px; border-radius: 14px; margin-bottom: 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
  .vinyl-label { display: flex; align-items: center; gap: 9px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.55); }
  .vinyl-switch-btn { font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 8px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); }

  .track-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .track-info { flex: 1; min-width: 0; }
  .track-title { font-size: 21px; font-weight: 700; letter-spacing: -0.4px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .track-artist { font-size: 14px; color: rgba(255,255,255,0.5); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ctrl-btns { display: flex; gap: 2px; flex-shrink: 0; }
  .ctrl-btn { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3); transition: color 0.2s, background 0.2s; }
  .ctrl-btn.on { color: #fff; background: rgba(255,255,255,0.1); }

  .vol-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .vol-icon { color: rgba(255,255,255,0.38); display: flex; align-items: center; }

  .controls { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .icon-btn { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: opacity 0.1s, transform 0.12s; }
  .icon-btn:active { opacity: 0.4; transform: scale(0.87); }
  .play-btn { width: 70px; height: 70px; border-radius: 50%; background: #fff; color: #000; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 28px rgba(255,255,255,0.22); transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1); }
  .play-btn:active { transform: scale(0.91); }

  .queue-btn { display: flex; align-items: center; justify-content: center; gap: 7px; padding: 13px 0 4px; color: rgba(255,255,255,0.35); font-size: 13px; font-weight: 500; border-top: 1px solid rgba(255,255,255,0.07); margin-top: auto; }
  .queue-btn:active { color: rgba(255,255,255,0.75); }

  .browse-header { display: flex; align-items: center; gap: 12px; padding: 0 0 14px; flex-shrink: 0; }
  .browse-back { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .browse-back:active { background: rgba(255,255,255,0.16); }
  .browse-title { font-size: 18px; font-weight: 700; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .search-wrap { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0 14px; margin-bottom: 16px; flex-shrink: 0; }
  .search-wrap:focus-within { border-color: rgba(255,255,255,0.3); }
  .search-icon { color: rgba(255,255,255,0.35); display: flex; flex-shrink: 0; }
  .search-input { flex: 1; background: none; border: none; outline: none; color: #fff; font-size: 15px; padding: 12px 0; }
  .search-input::placeholder { color: rgba(255,255,255,0.3); }
  .search-clear { color: rgba(255,255,255,0.3); font-size: 18px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,0.08); }

  .section-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.3); padding: 4px 0 10px; }
  .browse-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 12px; }
  .grid-item { background: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; cursor: pointer; transition: background 0.15s, transform 0.12s; border: 1px solid rgba(255,255,255,0.07); }
  .grid-item:active { background: rgba(255,255,255,0.1); transform: scale(0.97); }
  .grid-art { width: 100%; aspect-ratio: 1/1; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; }
  .grid-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .grid-art svg { width: 36px; height: 36px; color: rgba(255,255,255,0.2); }
  .grid-info { padding: 10px; }
  .grid-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .grid-sub { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .browse-list { margin-bottom: 12px; }
  .list-item { display: flex; align-items: center; gap: 14px; padding: 10px 0; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .list-item:active { opacity: 0.6; }
  .list-thumb { width: 46px; height: 46px; border-radius: 8px; flex-shrink: 0; background: rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .list-thumb.round { border-radius: 50%; }
  .list-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .list-thumb svg { width: 22px; height: 22px; color: rgba(255,255,255,0.25); }
  .list-info { flex: 1; min-width: 0; }
  .list-name { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .list-sub { font-size: 12px; color: rgba(255,255,255,0.38); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .list-action { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.6); font-size: 14px; }
  .list-action:active { background: rgba(255,255,255,0.18); }

  .browse-body { flex: 1; overflow-y: auto; padding-bottom: 20px; }
  .spinner { width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1); border-top-color: #fff; animation: spin 0.75s linear infinite; margin: 40px auto; display: block; }
  .empty { text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.28); }
  .empty b { display: block; font-size: 15px; font-weight: 600; margin-bottom: 6px; color: rgba(255,255,255,0.5); }

  .tabbar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 10; background: rgba(0,0,0,0.82); backdrop-filter: blur(28px) saturate(160%); -webkit-backdrop-filter: blur(28px) saturate(160%); border-top: 1px solid rgba(255,255,255,0.07); display: flex; align-items: stretch; height: calc(62px + env(safe-area-inset-bottom, 0px)); padding-bottom: env(safe-area-inset-bottom, 0px); }
  .tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; padding: 8px 4px; position: relative; color: rgba(255,255,255,0.32); font-size: 11px; font-weight: 500; letter-spacing: 0.02em; transition: color 0.18s; }
  .tab.active { color: #fff; font-weight: 600; }
  .tab-ind { position: absolute; top: 0; left: 18%; right: 18%; height: 2px; border-radius: 0 0 2px 2px; background: #fff; transform: scaleX(0); transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1); }
  .tab.active .tab-ind { transform: scaleX(1); }
  .tab-pip { position: absolute; top: 8px; right: 16%; width: 5px; height: 5px; border-radius: 50%; background: #1db954; }
  .mini-bars { display: flex; align-items: flex-end; gap: 1.5px; height: 10px; }
  .mini-bar { width: 2.5px; border-radius: 1px; background: rgba(255,255,255,0.65); transform-origin: bottom; animation: bars 0.9s ease-in-out infinite; }
  .grp-tab { width: 54px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; padding: 8px 4px; color: rgba(255,255,255,0.32); font-size: 10px; letter-spacing: 0.02em; border-left: 1px solid rgba(255,255,255,0.07); }
  .grp-tab:active { color: rgba(255,255,255,0.8); }

  .backdrop { position: absolute; inset: 0; z-index: 20; background: rgba(0,0,0,0.5); animation: fadeIn 0.22s ease; }
  .sheet { position: absolute; bottom: 0; left: 0; right: 0; z-index: 21; background: rgba(14,14,16,0.98); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border-radius: 22px 22px 0 0; display: flex; flex-direction: column; max-height: 78vh; animation: slideUp 0.32s cubic-bezier(0.16,1,0.3,1); padding-bottom: env(safe-area-inset-bottom, 8px); }
  .sh-handle-area { display: flex; flex-direction: column; align-items: center; padding: 12px 0 0; flex-shrink: 0; }
  .sh-handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.16); }
  .sh-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px 12px; flex-shrink: 0; border-bottom: 1px solid rgba(255,255,255,0.07); }
  .sh-title { font-size: 17px; font-weight: 700; }
  .sh-acts { display: flex; align-items: center; gap: 10px; }
  .sh-meta { font-size: 13px; color: rgba(255,255,255,0.32); }
  .sh-refresh { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.45); }
  .sh-x { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 15px; color: rgba(255,255,255,0.55); }
  .sh-body { flex: 1; overflow-y: auto; }
  .q-item { display: flex; align-items: center; gap: 14px; padding: 10px 20px; }
  .q-item.q-on { background: rgba(255,255,255,0.05); }
  .q-num { width: 26px; text-align: center; flex-shrink: 0; font-size: 13px; color: rgba(255,255,255,0.28); }
  .q-num.q-play { color: #1db954; font-size: 15px; }
  .q-info { flex: 1; min-width: 0; }
  .q-name { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .q-name.q-on { color: #fff; font-weight: 600; }
  .q-art { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .q-dur { font-size: 12px; color: rgba(255,255,255,0.25); flex-shrink: 0; }
  .room-row { display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .room-pip { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.15); flex-shrink: 0; }
  .room-pip.on { background: #1db954; }
  .room-nm { font-size: 15px; font-weight: 500; }
  .room-st { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 2px; }
  .act-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 16px 20px; }
  .act-btn { padding: 14px 16px; border-radius: 14px; text-align: left; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08); transition: opacity 0.12s; }
  .act-btn:active { opacity: 0.55; }
  .act-btn.danger { background: rgba(255,59,48,0.1); border-color: rgba(255,59,48,0.18); }
  .act-btn.muted  { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.05); }
  .act-lbl { font-size: 14px; font-weight: 600; }
  .act-lbl.danger { color: #ff453a; }
  .act-lbl.muted  { color: rgba(255,255,255,0.35); }
  .act-sub { font-size: 11px; color: rgba(255,255,255,0.28); margin-top: 3px; }

  @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
  @keyframes spin    { to { transform: rotate(360deg) } }
  @keyframes pulse   { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
  @keyframes bars    { 0%,100% { transform:scaleY(0.25) } 50% { transform:scaleY(1) } }
`

class HaAudioCard extends HTMLElement {
  constructor() {
    super()
    this._root          = this.attachShadow({ mode: 'open' })
    this._hass          = null
    this._room          = ROOMS[0].id
    this._view          = 'player'
    this._queueOpen     = false
    this._groupOpen     = false
    this._roomPickerOpen = false
    this._pendingPlay   = null
    this._queue         = []
    this._queueBusy     = false
    this._bgCurrent     = null
    this._bgFading      = false
    this._init          = false
    this._browseStack   = []
    this._browseLoading = false
    this._searchQuery   = ''
    this._searchResults = null
    this._searchTimer   = null
  }

  setConfig() {}

  set hass(hass) {
    this._hass = hass
    if (!this._init) { this._bootstrap(); this._init = true }
    this._syncBg()
    this._syncPlayer()
    this._syncTabbar()
  }

  _bootstrap() {
    this._root.innerHTML = `<style>${CSS}</style>
      <div class="app" id="app">
        <div class="bg" id="bg"></div>
        <div class="bg-overlay"></div>
        <div class="content" id="content">
          <div class="view" id="player-view"></div>
          <div class="view browse-view" id="browse-view" style="display:none"></div>
        </div>
        <div class="tabbar" id="tabbar"></div>
      </div>`
  }

  _syncBg() {
    const art = this._artUrl()
    if (art === this._bgCurrent || this._bgFading) return
    const bg = this._root.getElementById('bg')
    if (!bg) return
    this._bgFading = true
    bg.classList.add('bg-fade')
    setTimeout(() => {
      bg.style.backgroundImage = art ? `url(${art})` : 'none'
      bg.classList.remove('bg-fade')
      this._bgCurrent = art
      this._bgFading  = false
    }, 350)
  }

  _syncPlayer() {
    const el = this._root.getElementById('player-view')
    if (!el || this._view !== 'player') return
    const s       = this._stateObj()
    const attr    = s?.attributes || {}
    const playing = s?.state === 'playing'
    const title   = attr.media_title  || 'Nothing playing'
    const artist  = attr.media_artist || attr.media_album_name || ''
    const vol     = Math.round((attr.volume_level ?? 0.5) * 100)
    const shuffle = !!attr.shuffle
    const repeat  = attr.repeat || 'off'
    const art     = this._artUrl()
    const room    = this._roomObj()
    const massAttr = this._hass?.states[room.mass]?.attributes || {}
    const isLineIn = massAttr.source === 'Line-in'
    const source   = massAttr.source && massAttr.source !== 'Music Assistant Queue' ? massAttr.source : ''

    el.innerHTML = `
      <div class="view-tabs">
        <button class="vtab active" id="vtab-player">${I.note()} Now Playing</button>
        <button class="vtab" id="vtab-browse">${I.browse()} Browse</button>
      </div>
      <p class="np-label">${room.label}${source ? ' · <span style="opacity:0.55;font-size:10px">' + this._esc(source) + '</span>' : ''}</p>
      <div class="art-wrap">
        ${art ? `<img src="${art}" alt="">` : `<div class="art-placeholder">${I.note()}</div>`}
      </div>
      ${room.hasLineIn ? (isLineIn ? `
        <div class="linein-banner">
          <div class="linein-info">
            <div class="linein-dot"></div>
            <div><div class="linein-text">Vinyl / Line-in Active</div><div class="linein-sub">Record player playing</div></div>
          </div>
          <button class="linein-btn" id="btn-li-off">Switch to Queue</button>
        </div>` : `
        <div class="vinyl-toggle">
          <div class="vinyl-label">${I.vinyl()} Record Player</div>
          <button class="vinyl-switch-btn" id="btn-li-on">Switch to Line-in</button>
        </div>`) : ''}
      <div class="track-row">
        <div class="track-info">
          <div class="track-title">${this._esc(title)}</div>
          ${artist ? `<div class="track-artist">${this._esc(artist)}</div>` : ''}
        </div>
        <div class="ctrl-btns">
          <button class="ctrl-btn ${shuffle?'on':''}" id="btn-shuf">${I.shuffle()}</button>
          <button class="ctrl-btn ${repeat!=='off'?'on':''}" id="btn-rep">${repeat==='one'?I.repeat1():I.repeat()}</button>
        </div>
      </div>
      <div class="vol-row">
        <span class="vol-icon">${I.volLo()}</span>
        <input type="range" id="vol" min="0" max="100" value="${vol}"
          style="background:linear-gradient(to right,rgba(255,255,255,.85) ${vol}%,rgba(255,255,255,.18) ${vol}%)">
        <span class="vol-icon">${I.volHi()}</span>
      </div>
      <div class="controls">
        <button class="icon-btn" id="btn-prev">${I.prev()}</button>
        <button class="play-btn" id="btn-play">${playing?I.pause():I.play()}</button>
        <button class="icon-btn" id="btn-next">${I.next()}</button>
      </div>
      <button class="queue-btn" id="btn-queue">${I.queue()} Queue</button>`

    this._on('vtab-browse', () => { this._view='browse'; this._browseStack=[]; this._showView('browse'); this._syncBrowseView() })
    this._on('btn-li-on',  () => { haptic('medium'); this._hass.callService('media_player','select_source',{source:'Line-in'},{entity_id:room.mass}) })
    this._on('btn-li-off', () => { haptic('medium'); this._hass.callService('media_player','select_source',{source:'Music Assistant Queue'},{entity_id:room.mass}) })
    this._on('btn-play',   () => this._svc(playing?'media_pause':'media_play'))
    this._on('btn-prev',   () => this._svc('media_previous_track'))
    this._on('btn-next',   () => this._svc('media_next_track'))
    this._on('btn-shuf',   () => this._svc('shuffle_set',{shuffle:!shuffle}))
    this._on('btn-rep',    () => { const n=repeat==='off'?'all':repeat==='all'?'one':'off'; this._svc('repeat_set',{repeat:n}) })
    this._on('btn-queue',  () => { haptic('light'); this._openQueue() })
    const vEl = this._root.getElementById('vol')
    vEl?.addEventListener('input', e => { const v=+e.target.value; e.target.style.background=`linear-gradient(to right,rgba(255,255,255,.85) ${v}%,rgba(255,255,255,.18) ${v}%)` })
    vEl?.addEventListener('change', e => { this._call('media_player','volume_set',{volume_level:+e.target.value/100},{entity_id:room.sonos}) })
  }

  _showView(w) {
    const pv=this._root.getElementById('player-view'), bv=this._root.getElementById('browse-view')
    if (!pv||!bv) return
    if (w==='player') { pv.style.display='flex'; bv.style.display='none' }
    else              { pv.style.display='none'; bv.style.display='flex' }
  }

  _syncBrowseView() {
    const el = this._root.getElementById('browse-view')
    if (!el) return
    const atRoot  = this._browseStack.length === 0
    const current = this._browseStack[this._browseStack.length-1]
    el.innerHTML = `
      <div class="browse-header">
        ${!atRoot ? `<button class="browse-back" id="btn-back">${I.back()}</button>` : '<div style="width:34px"></div>'}
        <div class="browse-title">${atRoot?'Browse':this._esc(current?.title||'')}</div>
        <button style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.45);padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.07)" id="vtab-back">Now Playing</button>
      </div>
      <div class="search-wrap">
        <span class="search-icon">${I.search()}</span>
        <input class="search-input" id="s-input" type="text" placeholder="Search Spotify &amp; Plex…" value="${this._esc(this._searchQuery)}">
        ${this._searchQuery?`<button class="search-clear" id="btn-sc">✕</button>`:''}
      </div>
      <div class="browse-body" id="browse-body">
        ${this._browseLoading ? '<div class="spinner"></div>'
          : this._searchQuery ? this._renderSearch()
          : atRoot ? this._renderRoot()
          : this._renderLevel(current)}
      </div>`

    this._on('btn-back',  () => { this._browseStack.pop(); this._syncBrowseView() })
    this._on('vtab-back', () => { this._view='player'; this._showView('player'); this._syncPlayer() })
    this._on('btn-sc',    () => { this._searchQuery=''; this._searchResults=null; this._syncBrowseView() })

    const si = this._root.getElementById('s-input')
    si?.addEventListener('input', e => {
      this._searchQuery = e.target.value
      clearTimeout(this._searchTimer)
      if (this._searchQuery.length > 1) {
        this._searchTimer = setTimeout(() => this._doSearch(), 400)
      } else {
        this._searchResults = null
        const body = this._root.getElementById('browse-body')
        if (body) { body.innerHTML = this._renderRoot(); this._bindBrowseBodyEvents() }
      }
    })
    this._bindBrowseBodyEvents()
  }

  _bindBrowseBodyEvents() {
    this._root.querySelectorAll('[data-browse]').forEach(b =>
      b.addEventListener('click', () => { haptic('light'); try { this._browseItem(JSON.parse(decodeURIComponent(b.dataset.browse))) } catch(e) { console.error('browse parse error', e) } }))
    this._root.querySelectorAll('[data-play]').forEach(b =>
      b.addEventListener('click', ev => { ev.stopPropagation(); haptic('medium'); try { this._playItem(JSON.parse(decodeURIComponent(b.dataset.play))) } catch(e) { console.error('play parse error', e) } }))
  }

  _renderRoot() {
    const sections = [
      { id: 'playlists', label: 'Playlists', sub: 'Your playlists' },
      { id: 'albums',    label: 'Albums',    sub: 'Browse albums' },
      { id: 'artists',   label: 'Artists',   sub: 'Browse artists' },
      { id: 'tracks',    label: 'Tracks',    sub: 'All tracks' },
    ]
    let html = '<p class="section-label">Browse Library</p><div class="browse-list">'
    for (const s of sections) {
      const bd = encodeURIComponent(JSON.stringify({ contentId: s.id, contentType: 'music_assistant', label: s.label }))
      html += '<div class="list-item" data-browse="' + bd + '">'
      html += '<div class="list-thumb">' + I.browse() + '</div>'
      html += '<div class="list-info"><div class="list-name">' + s.label + '</div><div class="list-sub">' + s.sub + '</div></div>'
      html += '<div class="list-action">' + I.browse() + '</div>'
      html += '</div>'
    }
    html += '</div>'
    return html
  }

  _renderLevel(level) {
    if (!level?.items?.length) return '<div class="empty"><b>Nothing here</b>Try a different section</div>'
    const items = level.items
    const isTrack = items[0] && items[0].media_content_type === 'music' && !items[0].can_expand
    if (isTrack) {
      let html = '<div class="browse-list">'
      for (const item of items) {
        const ep = encodeURIComponent(JSON.stringify({ contentId: item.media_content_id, contentType: item.media_content_type, name: item.title }))
        html += '<div class="list-item">'
        html += '<div class="list-thumb">' + (item.thumbnail ? '<img src="' + this._esc(item.thumbnail) + '" loading="lazy">' : I.note()) + '</div>'
        html += '<div class="list-info"><div class="list-name">' + this._esc(item.title) + '</div></div>'
        html += '<button class="list-action" data-play="' + ep + '">&#9654;</button>'
        html += '</div>'
      }
      html += '</div>'
      return html
    }
    let html = '<div class="browse-grid">'
    for (const item of items) {
      const bd = encodeURIComponent(JSON.stringify({ contentId: item.media_content_id, contentType: item.media_content_type, label: item.title }))
      const ep = encodeURIComponent(JSON.stringify({ contentId: item.media_content_id, contentType: item.media_content_type, name: item.title }))
      html += '<div class="grid-item"' + (item.can_expand ? ' data-browse="' + bd + '"' : '') + '>'
      html += '<div class="grid-art">' + (item.thumbnail ? '<img src="' + this._esc(item.thumbnail) + '" loading="lazy">' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="' + this._ip('album') + '"/></svg>') + '</div>'
      html += '<div class="grid-info"><div class="grid-name">' + this._esc(item.title) + '</div>'
      if (item.can_play) html += '<button class="list-action" style="margin-top:4px" data-play="' + ep + '">&#9654;</button>'
      html += '</div></div>'
    }
    html += '</div>'
    return html
  }

  _renderSearch() {
    if (!this._searchResults) return '<div class="spinner"></div>'
    const items = this._searchResults
    if (!items.length) return '<div class="empty"><b>No results</b>Try a different search</div>'
    const groups = {}
    for (const item of items) {
      const t = item._resultType || item.media_type || 'track'
      if (!groups[t]) groups[t] = []
      groups[t].push(item)
    }
    let html = ''
    for (const [type, groupItems] of Object.entries(groups)) {
      const typeLabel = type.endsWith('s') ? type : type + 's'
      html += '<p class="section-label">' + typeLabel.toUpperCase() + '</p><div class="browse-list">'
      for (const item of groupItems) {
        const canDrill = type !== 'track'
        const bd = encodeURIComponent(JSON.stringify({ contentId: item.uri, contentType: item.media_type || 'music_assistant', label: item.name, isUri: true }))
        const ep = encodeURIComponent(JSON.stringify({ contentId: item.uri, contentType: item.media_type || 'music', name: item.name, isUri: true }))
        const thumb = item.image ? '<img src="' + this._esc(item.image) + '" loading="lazy">' : I.note()
        html += '<div class="list-item"' + (canDrill ? ' data-browse="' + bd + '"' : '') + '>'
        html += '<div class="list-thumb">' + thumb + '</div>'
        html += '<div class="list-info"><div class="list-name">' + this._esc(item.name) + '</div>'
        if (item.version) html += '<div class="list-sub">' + this._esc(item.version) + '</div>'
        html += '</div>'
        html += '<button class="list-action" data-play="' + ep + '">&#9654;</button>'
        html += '</div>'
      }
      html += '</div>'
    }
    return html
  }

  async _browseItem(data) {
    if (typeof data === 'string') data = JSON.parse(data)
    this._searchQuery = ''
    this._searchResults = null
    this._browseLoading = true
    this._browseStack.push({ title: data.label || data.name || 'Browse', items: [] })
    this._syncBrowseView()
    try {
      const res = await this._hass.connection.sendMessagePromise({
        type: 'media_player/browse_media',
        entity_id: this._roomObj().mass,
        media_content_id: data.contentId,
        media_content_type: data.isUri ? 'music_assistant' : data.contentType,
      })
      this._browseStack[this._browseStack.length-1].items = res?.children || []
    } catch(e) {
      console.error('Browse error', e)
      this._browseStack[this._browseStack.length-1].items = []
    }
    this._browseLoading = false
    this._syncBrowseView()
  }

  async _doSearch() {
    if (!this._searchQuery) return
    this._searchResults = null
    const body = this._root.getElementById('browse-body')
    if (body) body.innerHTML = '<div class="spinner"></div>'
    try {
      const res = await this._hass.connection.sendMessagePromise({
        type: 'call_service',
        domain: 'music_assistant',
        service: 'search',
        service_data: {
          config_entry_id: this._maConfigEntry(),
          name: this._searchQuery,
          media_type: ['track', 'album', 'artist', 'playlist'],
          limit: 8,
        },
        return_response: true,
      })
      const r = res?.response || {}
      const results = []
      for (const [type, items] of Object.entries(r)) {
        if (!Array.isArray(items)) continue
        for (const item of items) results.push({ ...item, _resultType: type })
      }
      this._searchResults = results
    } catch(e) {
      console.error('Search error', e)
      this._searchResults = []
    }
    if (body && this._searchQuery) {
      body.innerHTML = this._renderSearch()
      this._bindBrowseBodyEvents()
    } else {
      this._syncBrowseView()
    }
  }

  _playItem(item) {
    if (typeof item === 'string') item = JSON.parse(item)
    haptic('medium')
    this._pendingPlay = item
    this._roomPickerOpen = true
    this._renderSheet()
  }

  _playInRoom(room) {
    const item = this._pendingPlay
    if (!item) return
    haptic('medium')
    if (item.isUri) {
      this._hass.callService('music_assistant', 'play_media', { media_id: item.contentId, media_type: item.contentType, enqueue: 'replace' }, { entity_id: room.mass })
    } else {
      this._hass.callService('media_player', 'play_media', { media_content_id: item.contentId, media_content_type: item.contentType || 'music' }, { entity_id: room.mass })
    }
    this._room = room.id
    this._pendingPlay = null
    this._roomPickerOpen = false
    this._closeSheet()
    this._view = 'player'
    this._showView('player')
    this._syncPlayer()
    this._syncTabbar()
  }

  _syncTabbar() {
    const el = this._root.getElementById('tabbar')
    if (!el) return
    el.innerHTML = ROOMS.map(r => {
      const active  = this._room===r.id
      const playing = this._hass?.states[r.sonos]?.state==='playing'
      return `<button class="tab ${active?'active':''}" data-rid="${r.id}">
        <div class="tab-ind"></div>
        ${playing&&!active?'<div class="tab-pip"></div>':''}
        ${active&&playing?this._wb():''}
        <span>${r.label}</span>
      </button>`
    }).join('') + `<button class="grp-tab" id="btn-grp">${I.group()}<span>Group</span></button>`
    el.querySelectorAll('.tab[data-rid]').forEach(b=>b.addEventListener('click',()=>{
      haptic('light'); this._room=b.dataset.rid; this._browseStack=[]
      this._syncBg()
      if (this._view==='player') this._syncPlayer(); else this._syncBrowseView()
      this._syncTabbar()
    }))
    this._on('btn-grp',()=>{ haptic('medium'); this._openGroup() })
  }

  _openQueue() { this._queueOpen=true; this._renderSheet(); this._loadQueue() }
  _openGroup() { this._groupOpen=true; this._renderSheet() }

  async _loadQueue() {
    this._queueBusy=true; this._renderSheet()
    try {
      const res = await this._hass.connection.sendMessagePromise({ type:'mass/queue_items', player_id:this._roomObj().mass.replace('media_player.','') })
      this._queue = res?.items||[]
    } catch { this._queue=[] }
    this._queueBusy=false; this._renderSheet()
  }

  _renderSheet() {
    this._root.getElementById('backdrop')?.remove()
    this._root.getElementById('sheet')?.remove()
    if (!this._queueOpen && !this._groupOpen && !this._roomPickerOpen) return

    const app = this._root.getElementById('app')
    const bd  = document.createElement('div')
    bd.className='backdrop'; bd.id='backdrop'
    bd.addEventListener('click', () => this._closeSheet())
    app.appendChild(bd)

    const sh = document.createElement('div')
    sh.className='sheet'; sh.id='sheet'

    // ── Room picker ──
    if (this._roomPickerOpen) {
      const item = this._pendingPlay
      const itemName = item ? item.name || '' : ''
      let rowsHtml = ''
      for (const r of ROOMS) {
        const s = this._hass?.states[r.sonos]
        const playing = s?.state === 'playing'
        const vol = Math.round(((s?.attributes?.volume_level) || 0) * 100)
        const isActive = this._room === r.id
        rowsHtml += '<div class="room-row" style="cursor:pointer' + (isActive ? ';background:rgba(255,255,255,0.04)' : '') + '" data-room-play="' + r.id + '">'
        rowsHtml += '<div class="room-pip' + (playing ? ' on' : '') + '"></div>'
        rowsHtml += '<div style="flex:1"><div class="room-nm">' + r.label
        if (isActive) rowsHtml += ' <span style="font-size:11px;color:rgba(255,255,255,0.35)">· current</span>'
        rowsHtml += '</div><div class="room-st">' + (playing ? 'Playing · ' + vol + '%' : (s?.state === 'paused' ? 'Paused' : 'Idle')) + '</div></div>'
        rowsHtml += '<div style="color:rgba(255,255,255,0.4);font-size:20px">&#9654;</div></div>'
      }
      sh.innerHTML = '<div class="sh-handle-area"><div class="sh-handle"></div></div>'
        + '<div class="sh-header"><span class="sh-title">Play in…</span><button class="sh-x" id="sh-close">✕</button></div>'
        + '<div class="sh-body">'
        + '<div style="padding:8px 20px 4px;font-size:13px;color:rgba(255,255,255,0.4)">' + this._esc(itemName) + '</div>'
        + rowsHtml
        + '<div style="padding:16px 20px"><button class="act-btn muted" id="act-cancel" style="width:100%;text-align:center"><div class="act-lbl muted">Cancel</div></button></div>'
        + '</div>'
      app.appendChild(sh)
      sh.querySelector('#sh-close').addEventListener('click', () => { this._roomPickerOpen=false; this._pendingPlay=null; this._closeSheet() })
      sh.querySelector('#act-cancel').addEventListener('click', () => { this._roomPickerOpen=false; this._pendingPlay=null; this._closeSheet() })
      sh.querySelectorAll('[data-room-play]').forEach(el => {
        el.addEventListener('click', () => {
          const room = ROOMS.find(r => r.id === el.dataset.roomPlay)
          if (room) this._playInRoom(room)
        })
      })
      return
    }

    // ── Group sheet ──
    if (this._groupOpen) {
      const masterState = this._hass?.states[this._roomObj().sonos]
      const groupMembers = masterState?.attributes?.group_members || [this._roomObj().sonos]
      let rowsHtml = ''
      for (const r of ROOMS) {
        const s = this._hass?.states[r.sonos]
        const playing = s?.state === 'playing' || s?.state === 'paused'
        const vol = Math.round(((s?.attributes?.volume_level) || 0) * 100)
        const isCurrentRoom = r.id === this._room
        const isInGroup = groupMembers.includes(r.sonos)
        rowsHtml += '<div class="room-row" style="' + (isCurrentRoom ? 'background:rgba(255,255,255,0.04)' : '') + '">'
        rowsHtml += '<div class="room-pip' + (playing ? ' on' : '') + '"></div>'
        rowsHtml += '<div style="flex:1"><div class="room-nm">' + r.label
        if (isCurrentRoom) rowsHtml += ' <span style="font-size:11px;color:rgba(255,255,255,0.35)">· playing here</span>'
        rowsHtml += '</div><div class="room-st">' + (playing ? 'Playing · ' + vol + '%' : (s?.state || 'Idle')) + '</div></div>'
        if (!isCurrentRoom) {
          if (isInGroup) {
            rowsHtml += '<button class="act-btn" style="padding:8px 14px;border-color:rgba(56,189,248,0.4);background:rgba(56,189,248,0.1)" data-unjoin="' + r.sonos + '"><div class="act-lbl" style="color:#38bdf8;font-size:12px">Remove</div></button>'
          } else {
            rowsHtml += '<button class="act-btn" style="padding:8px 14px" data-join="' + r.sonos + '"><div class="act-lbl" style="font-size:12px">Add</div></button>'
          }
        }
        rowsHtml += '</div>'
      }
      sh.innerHTML = '<div class="sh-handle-area"><div class="sh-handle"></div></div>'
        + '<div class="sh-header"><span class="sh-title">Speakers</span><button class="sh-x" id="sh-close">✕</button></div>'
        + '<div class="sh-body">'
        + '<div style="padding:8px 20px 4px;font-size:12px;color:rgba(255,255,255,0.35);letter-spacing:0.06em;text-transform:uppercase">Tap to add or remove from group</div>'
        + rowsHtml
        + '<div class="act-grid">'
        + '<button class="act-btn" id="act-whole"><div class="act-lbl">Whole House</div><div class="act-sub">Add all speakers</div></button>'
        + '<button class="act-btn" id="act-ung"><div class="act-lbl">Ungroup All</div><div class="act-sub">Independent speakers</div></button>'
        + '<button class="act-btn danger" id="act-stop"><div class="act-lbl danger">Stop All</div><div class="act-sub">Pause everything</div></button>'
        + '<button class="act-btn muted" id="act-cancel"><div class="act-lbl muted">Close</div></button>'
        + '</div></div>'
      app.appendChild(sh)
      sh.querySelector('#sh-close').addEventListener('click', () => this._closeSheet())
      sh.querySelector('#act-whole').addEventListener('click', () => {
        haptic('medium')
        const others = ALL_SONOS.filter(e => e !== this._roomObj().sonos)
        this._call('sonos', 'join', { master: this._roomObj().sonos, entity_id: others })
        setTimeout(() => { this._groupOpen=true; this._renderSheet() }, 600)
      })
      sh.querySelector('#act-ung').addEventListener('click', () => {
        haptic('medium'); this._call('sonos','unjoin',{},{entity_id:ALL_SONOS}); this._closeSheet()
      })
      sh.querySelector('#act-stop').addEventListener('click', () => {
        haptic('heavy'); this._call('media_player','media_stop',{},{entity_id:ALL_SONOS}); this._closeSheet()
      })
      sh.querySelector('#act-cancel').addEventListener('click', () => this._closeSheet())
      sh.querySelectorAll('[data-join]').forEach(btn => {
        btn.addEventListener('click', () => {
          haptic('light')
          this._call('sonos', 'join', { master: this._roomObj().sonos, entity_id: [btn.dataset.join] })
          setTimeout(() => { this._groupOpen=true; this._renderSheet() }, 800)
        })
      })
      sh.querySelectorAll('[data-unjoin]').forEach(btn => {
        btn.addEventListener('click', () => {
          haptic('light')
          this._call('sonos', 'unjoin', {}, { entity_id: [btn.dataset.unjoin] })
          setTimeout(() => { this._groupOpen=true; this._renderSheet() }, 800)
        })
      })
      return
    }

    // ── Queue sheet ──
    sh.innerHTML = `
      <div class="sh-handle-area"><div class="sh-handle"></div></div>
      <div class="sh-header">
        <span class="sh-title">Queue</span>
        <div class="sh-acts">
          <span class="sh-meta">${this._queue.length} tracks</span>
          <button class="sh-refresh" id="sh-ref">Refresh</button>
          <button class="sh-x" id="sh-close">✕</button>
        </div>
      </div>
      <div class="sh-body">
        ${this._queueBusy ? '<div class="spinner"></div>' : this._queue.length===0 ? '<div class="empty"><b>Queue is empty</b>Browse and play something</div>' : this._queue.map((item,i) => `
          <div class="q-item ${item.active?'q-on':''}">
            <div class="q-num ${item.active?'q-play':''}">${item.active?'▶':i+1}</div>
            <div class="q-info">
              <div class="q-name ${item.active?'q-on':''}">${this._esc(item.name||'Unknown')}</div>
              ${item.artists?.[0]?.name ? `<div class="q-art">${this._esc(item.artists[0].name)}</div>` : ''}
            </div>
            ${item.duration ? `<div class="q-dur">${this._dur(item.duration)}</div>` : ''}
          </div>`).join('')}
      </div>`
    app.appendChild(sh)
    this._on('sh-close', () => this._closeSheet())
    this._on('sh-ref',   () => { haptic('light'); this._loadQueue() })
  }

  _closeSheet() { this._queueOpen=false; this._groupOpen=false; this._roomPickerOpen=false; this._pendingPlay=null; this._renderSheet() }
  _roomObj()    { return ROOMS.find(r=>r.id===this._room) }
  _stateObj()   { return this._hass?.states[this._roomObj()?.sonos] }
  _artUrl() {
    const pic=this._stateObj()?.attributes?.entity_picture
    if (!pic) return null
    return pic.startsWith('http')?pic:`${location.protocol}//${location.hostname}:8123${pic}`
  }
  _svc(service,data={}) { this._call('media_player',service,data,{entity_id:this._roomObj().sonos}) }
  _call(domain,service,data={},target={}) { haptic('light'); this._hass.callService(domain,service,data,Object.keys(target).length?target:undefined) }
  _on(id,fn) { this._root.getElementById(id)?.addEventListener('click',fn) }
  _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
  _dur(s) { return s?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`:'' }
  _wb()   { return `<div class="mini-bars">${[.5,1,.65,.9,.4].map((h,i)=>`<div class="mini-bar" style="height:${h*100}%;animation-delay:${i*.13}s"></div>`).join('')}</div>` }
  _ip(type) {
    return {
      track:    'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
      album:    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z',
      artist:   'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      playlist: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z',
    }[type] || 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'
  }
  _maConfigEntry() {
    const maEntity = Object.values(this._hass.entities||{}).find(e=>e.platform==='music_assistant')
    if (!maEntity) return ''
    const device = this._hass.devices?.[maEntity.device_id]
    return device?.config_entries?.[0] || ''
  }
}

window.customCards = window.customCards || []
window.customCards.push({ type: 'ha-audio-card', name: 'Home Audio Card', description: 'Custom audio controller' })
if (!customElements.get('ha-audio-card')) { window.customElements.define('ha-audio-card', HaAudioCard) }
