/**
 * ha-audio-card.js — Home Audio Card
 * github.com/stroppyllama/ha-audio-panel
 *
 * DESIGN
 * ──────
 * Color palette: #111214 bg · #1A1C1F surface · #21242A card
 *                #C8A96E accent (warm brass) · #EEE9E0 text
 *
 * Entity strategy
 * ───────────────
 * Primary control: Music Assistant media_player entities
 *   – play/pause/skip, shuffle/repeat, artwork, queue, browse, search
 * Sonos entities: ONLY for group join/unjoin (MA doesn't expose this)
 * Volume: MA entity (it proxies to Sonos correctly)
 * Line-in: MA entity source select
 */

/* ── Room definitions ───────────────────────────────────────────────────── */
const ROOMS = [
  {
    id: 'kitchen',
    label: 'Kitchen',
    mass: 'media_player.kitchen',
    sonos: 'media_player.sonos_move',
    hasLineIn: false,
  },
  {
    id: 'basement',
    label: 'Basement',
    mass: 'media_player.basement',
    sonos: 'media_player.basement_fives',
    hasLineIn: true,
  },
  {
    id: 'closet',
    label: 'Walk-in',
    mass: 'media_player.closet_2',
    sonos: 'media_player.closet',
    hasLineIn: false,
  },
  {
    id: 'hallway',
    label: 'Hallway',
    mass: 'media_player.upstairs_hallway',
    sonos: 'media_player.move_2',
    hasLineIn: false,
  },
  {
    id: 'record',
    label: 'Record Player',
    mass: 'media_player.basement_port',
    sonos: 'media_player.basement_port',
    hasLineIn: true,
    sonosOnly: true,
  },
]

const ALL_MASS  = ROOMS.filter(r => !r.sonosOnly).map(r => r.mass)
const ALL_SONOS = ROOMS.map(r => r.sonos)

/* ── Palette ────────────────────────────────────────────────────────────── */
const P = {
  bg:        '#0E0F11',
  surface:   '#161719',
  card:      '#1C1E21',
  cardHov:   '#222527',
  border:    'rgba(238,233,224,0.07)',
  text:      '#EEE9E0',
  sub:       'rgba(238,233,224,0.52)',
  muted:     'rgba(238,233,224,0.28)',
  accent:    '#C8A96E',
  accentLo:  'rgba(200,169,110,0.14)',
  accentMid: 'rgba(200,169,110,0.28)',
  green:     '#4ADE80',
  amber:     '#FFC83C',
  red:       '#F87171',
}

/* ── SVG icons (inline, no external deps) ──────────────────────────────── */
const svg = (d, s = 24) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor"><path d="${d}"/></svg>`

const I = {
  play:    svg('M8 5v14l11-7z'),
  pause:   svg('M6 19h4V5H6v14zm8-14v14h4V5h-4z'),
  prev:    svg('M6 6h2v12H6zm3.5 6 8.5 6V6z'),
  next:    svg('M6 18l8.5-6L6 6v12zM16 6h2v12h-2z'),
  shuffle: svg('M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z'),
  repeat:  svg('M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z'),
  repeat1: svg('M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z'),
  search:  svg('M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'),
  queue:   svg('M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z'),
  browse:  svg('M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z'),
  group:   svg('M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'),
  back:    svg('M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z'),
  vinyl:   svg('M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z'),
  note:    svg('M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'),
  close:   svg('M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'),
  volLo:   svg('M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z', 20),
  volHi:   svg('M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z', 20),
}

const haptic = (t = 'light') => {
  if ('vibrate' in navigator) navigator.vibrate({ light: [8], medium: [15], heavy: [25, 8, 25] }[t] || [8])
}

/* ── CSS ────────────────────────────────────────────────────────────────── */
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:host{display:block;height:100vh;height:100dvh;font-family:-apple-system,'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;user-select:none;color:${P.text}}
button,input{font-family:inherit;-webkit-tap-highlight-color:transparent}
button{cursor:pointer;border:none;outline:none;background:none;color:inherit}
input[type=range]{-webkit-appearance:none;appearance:none;height:3px;border-radius:2px;outline:none;cursor:pointer;width:100%}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:17px;height:17px;border-radius:50%;background:${P.accent};border:2px solid ${P.bg};box-shadow:0 0 0 1px ${P.accent};transition:transform .15s}
input[type=range]:active::-webkit-slider-thumb{transform:scale(1.2)}
input[type=range]::-moz-range-thumb{width:17px;height:17px;border-radius:50%;background:${P.accent};border:2px solid ${P.bg}}
::-webkit-scrollbar{display:none}

.app{position:relative;width:100%;height:100vh;height:100dvh;overflow:hidden;background:${P.bg}}
.bg{position:absolute;inset:-40px;z-index:0;background-size:cover;background-position:center;filter:blur(55px) saturate(180%) brightness(0.22);transform:scale(1.12);transition:opacity .7s ease}
.bg.fade{opacity:0}
.overlay{position:absolute;inset:0;z-index:1;background:linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0) 25%,rgba(0,0,0,0.5) 65%,rgba(0,0,0,0.96) 100%)}

.content{position:relative;z-index:2;height:calc(100dvh - 64px - env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;align-items:center;overflow:hidden}
.view{width:100%;max-width:460px;height:100%;overflow-y:auto;padding:14px 22px 20px;display:flex;flex-direction:column}
.view.browse-view{padding-top:14px}

/* ── Player ── */
.now-room{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${P.accent};text-align:center;margin-bottom:10px;flex-shrink:0}
.art-wrap{width:100%;max-height:36vh;aspect-ratio:1/1;border-radius:18px;overflow:hidden;background:${P.card};box-shadow:0 24px 72px rgba(0,0,0,0.7);margin-bottom:14px;flex-shrink:0;align-self:center;border:1px solid ${P.border}}
.art-wrap img{width:100%;height:100%;object-fit:cover;display:block}
.art-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${P.muted}}
.art-placeholder svg{width:56px;height:56px}

.linein-banner{display:flex;align-items:center;justify-content:space-between;padding:11px 15px;border-radius:12px;margin-bottom:12px;background:rgba(255,200,60,0.08);border:1px solid rgba(255,200,60,0.22);flex-shrink:0}
.linein-dot{width:7px;height:7px;border-radius:50%;background:${P.amber};animation:pulse 2s infinite;flex-shrink:0}
.linein-text{font-size:13px;font-weight:600;color:${P.amber};margin-left:9px}
.linein-sub{font-size:11px;color:rgba(255,200,60,0.55);margin-top:1px;margin-left:9px}
.linein-btn{font-size:12px;font-weight:600;padding:6px 12px;border-radius:8px;background:rgba(255,200,60,0.12);border:1px solid rgba(255,200,60,0.28);color:${P.amber}}
.vinyl-row{display:flex;align-items:center;justify-content:space-between;padding:10px 15px;border-radius:12px;margin-bottom:12px;background:${P.card};border:1px solid ${P.border};flex-shrink:0}
.vinyl-lbl{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;color:${P.sub}}
.vinyl-btn{font-size:12px;font-weight:600;padding:6px 12px;border-radius:8px;background:${P.accentLo};border:1px solid ${P.accentMid};color:${P.accent}}

.track-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;flex-shrink:0}
.track-info{flex:1;min-width:0}
.track-title{font-size:20px;font-weight:700;letter-spacing:-.3px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.track-artist{font-size:13px;color:${P.sub};margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ctrl-btns{display:flex;gap:2px;flex-shrink:0;padding-top:2px}
.ctrl-btn{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:${P.muted};transition:color .2s,background .2s}
.ctrl-btn.on{color:${P.accent};background:${P.accentLo}}

.vol-row{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-shrink:0}
.vol-icon{color:${P.muted};display:flex;align-items:center;flex-shrink:0}

.transport{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-shrink:0}
.t-btn{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:${P.sub};transition:opacity .12s,transform .12s}
.t-btn:active{opacity:.45;transform:scale(.88)}
.play-btn{width:68px;height:68px;border-radius:50%;background:${P.accent};color:${P.bg};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(200,169,110,0.38);transition:transform .15s cubic-bezier(.34,1.56,.64,1)}
.play-btn:active{transform:scale(.91)}

.bottom-row{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:10px;border-top:1px solid ${P.border};flex-shrink:0}
.bottom-btn{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:500;color:${P.muted};transition:color .15s,background .15s}
.bottom-btn:hover,.bottom-btn:active{color:${P.text};background:${P.card}}

/* ── Tab bar ── */
.tabbar{position:fixed;bottom:0;left:0;right:0;z-index:10;background:rgba(11,12,14,0.88);backdrop-filter:blur(28px) saturate(160%);-webkit-backdrop-filter:blur(28px) saturate(160%);border-top:1px solid ${P.border};display:flex;align-items:stretch;height:calc(64px + env(safe-area-inset-bottom,0px));padding-bottom:env(safe-area-inset-bottom,0px)}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px 2px;position:relative;color:${P.muted};font-size:10px;font-weight:500;letter-spacing:.02em;transition:color .18s}
.tab.active{color:${P.accent};font-weight:700}
.tab-bar{position:absolute;top:0;left:20%;right:20%;height:2px;border-radius:0 0 2px 2px;background:${P.accent};transform:scaleX(0);transition:transform .28s cubic-bezier(.34,1.56,.64,1)}
.tab.active .tab-bar{transform:scaleX(1)}
.tab-pip{position:absolute;top:7px;right:14%;width:5px;height:5px;border-radius:50%;background:${P.green}}
.mini-bars{display:flex;align-items:flex-end;gap:1.5px;height:10px}
.mini-bar{width:2.5px;border-radius:1px;background:${P.accent};transform-origin:bottom;animation:bars .9s ease-in-out infinite}
.grp-tab{width:52px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px 2px;color:${P.muted};font-size:10px;letter-spacing:.02em;border-left:1px solid ${P.border};transition:color .15s}
.grp-tab:active{color:${P.text}}

/* ── Browse ── */
.browse-header{display:flex;align-items:center;gap:10px;padding-bottom:12px;flex-shrink:0}
.browse-back{width:32px;height:32px;border-radius:50%;background:${P.card};border:1px solid ${P.border};display:flex;align-items:center;justify-content:center;flex-shrink:0}
.browse-back:active{background:${P.cardHov}}
.browse-title{font-size:17px;font-weight:700;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.search-wrap{display:flex;align-items:center;gap:8px;background:${P.card};border:1px solid ${P.border};border-radius:12px;padding:0 13px;margin-bottom:14px;flex-shrink:0;transition:border-color .2s}
.search-wrap:focus-within{border-color:${P.accentMid}}
.search-icon{color:${P.muted};display:flex;flex-shrink:0}
.search-input{flex:1;background:none;border:none;outline:none;color:${P.text};font-size:14px;padding:11px 0}
.search-input::placeholder{color:${P.muted}}
.search-clear{width:22px;height:22px;border-radius:50%;background:${P.surface};display:flex;align-items:center;justify-content:center;color:${P.muted};font-size:12px;flex-shrink:0}

/* ── search type filter pills ── */
.filter-pills{display:flex;gap:7px;margin-bottom:12px;flex-shrink:0;overflow-x:auto;padding-bottom:2px}
.fpill{padding:5px 13px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid ${P.border};color:${P.muted};background:transparent;white-space:nowrap;transition:all .15s}
.fpill.on{background:${P.accentLo};border-color:${P.accentMid};color:${P.accent}}

.section-lbl{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${P.muted};padding:4px 0 9px}
.browse-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:10px}
.grid-item{background:${P.card};border-radius:12px;overflow:hidden;cursor:pointer;transition:background .15s,transform .12s;border:1px solid ${P.border}}
.grid-item:active{background:${P.cardHov};transform:scale(.97)}
.grid-art{width:100%;aspect-ratio:1/1;background:${P.surface};display:flex;align-items:center;justify-content:center;position:relative}
.grid-art img{width:100%;height:100%;object-fit:cover;display:block}
.grid-art svg{width:32px;height:32px;color:${P.muted}}
.grid-play{position:absolute;bottom:7px;right:7px;width:30px;height:30px;border-radius:50%;background:${P.accent};color:${P.bg};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.5)}
.grid-info{padding:9px 10px}
.grid-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.grid-sub{font-size:11px;color:${P.muted};margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.list-item{display:flex;align-items:center;gap:13px;padding:9px 0;cursor:pointer;border-bottom:1px solid ${P.border}}
.list-item:last-child{border-bottom:none}
.list-item:active{opacity:.6}
.list-thumb{width:44px;height:44px;border-radius:8px;flex-shrink:0;background:${P.surface};display:flex;align-items:center;justify-content:center;overflow:hidden}
.list-thumb img{width:100%;height:100%;object-fit:cover}
.list-thumb svg{width:20px;height:20px;color:${P.muted}}
.list-info{flex:1;min-width:0}
.list-name{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.list-sub{font-size:11px;color:${P.muted};margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.list-play{width:30px;height:30px;border-radius:50%;flex-shrink:0;background:${P.accentLo};border:1px solid ${P.accentMid};display:flex;align-items:center;justify-content:center;color:${P.accent};font-size:12px}
.list-play:active{background:${P.accentMid}}

.browse-body{flex:1;overflow-y:auto;padding-bottom:12px}
.spinner{width:20px;height:20px;border-radius:50%;border:2px solid ${P.border};border-top-color:${P.accent};animation:spin .7s linear infinite;margin:44px auto;display:block}
.empty{text-align:center;padding:40px 20px;color:${P.muted}}
.empty b{display:block;font-size:14px;font-weight:600;margin-bottom:5px;color:${P.sub}}

/* ── Sheet ── */
.backdrop{position:absolute;inset:0;z-index:20;background:rgba(0,0,0,0.55);animation:fadeIn .2s ease}
.sheet{position:absolute;bottom:0;left:0;right:0;z-index:21;background:rgba(15,16,18,0.98);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border-radius:20px 20px 0 0;display:flex;flex-direction:column;max-height:80vh;animation:slideUp .3s cubic-bezier(.16,1,.3,1);padding-bottom:env(safe-area-inset-bottom,10px)}
.sh-pill-wrap{display:flex;flex-direction:column;align-items:center;padding:10px 0 0;flex-shrink:0}
.sh-pill{width:34px;height:3px;border-radius:2px;background:${P.border}}
.sh-head{display:flex;align-items:center;justify-content:space-between;padding:12px 18px 10px;border-bottom:1px solid ${P.border};flex-shrink:0}
.sh-title{font-size:16px;font-weight:700}
.sh-meta{font-size:12px;color:${P.muted}}
.sh-x{width:26px;height:26px;border-radius:50%;background:${P.card};display:flex;align-items:center;justify-content:center;color:${P.sub}}
.sh-body{flex:1;overflow-y:auto}

.room-row{display:flex;align-items:center;gap:13px;padding:13px 18px;border-bottom:1px solid ${P.border};cursor:pointer;transition:background .12s}
.room-row:active,.room-row:hover{background:${P.card}}
.room-pip{width:8px;height:8px;border-radius:50%;background:${P.border};flex-shrink:0}
.room-pip.on{background:${P.green}}
.room-name{font-size:14px;font-weight:500}
.room-state{font-size:11px;color:${P.muted};margin-top:2px}
.room-action{padding:7px 13px;border-radius:8px;font-size:12px;font-weight:600;border:1px solid ${P.border};color:${P.sub};background:transparent;flex-shrink:0}
.room-action.on{background:${P.accentLo};border-color:${P.accentMid};color:${P.accent}}
.room-action.danger{background:rgba(248,113,113,0.1);border-color:rgba(248,113,113,0.25);color:${P.red}}

.act-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:14px 18px}
.act-btn{padding:13px 14px;border-radius:13px;text-align:left;background:${P.card};border:1px solid ${P.border};transition:opacity .12s}
.act-btn:active{opacity:.5}
.act-btn.danger{background:rgba(248,113,113,0.08);border-color:rgba(248,113,113,0.2)}
.act-btn.muted{background:${P.surface};border-color:${P.border}}
.act-btn.accent{background:${P.accentLo};border-color:${P.accentMid}}
.act-lbl{font-size:13px;font-weight:600}
.act-lbl.danger{color:${P.red}}
.act-lbl.muted{color:${P.muted}}
.act-lbl.accent{color:${P.accent}}
.act-sub{font-size:11px;color:${P.muted};margin-top:3px}

.q-item{display:flex;align-items:center;gap:13px;padding:9px 18px}
.q-item.current{background:${P.card}}
.q-num{width:24px;text-align:center;flex-shrink:0;font-size:12px;color:${P.muted}}
.q-num.current{color:${P.accent}}
.q-art{width:38px;height:38px;border-radius:6px;background:${P.surface};flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center}
.q-art img{width:100%;height:100%;object-fit:cover}
.q-name{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${P.sub}}
.q-name.current{color:${P.text};font-weight:600}
.q-artist{font-size:11px;color:${P.muted};margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.q-dur{font-size:11px;color:${P.muted};flex-shrink:0}

@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes bars{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
`

/* ── The card ───────────────────────────────────────────────────────────── */
class HaAudioCard extends HTMLElement {
  constructor() {
    super()
    this._root = this.attachShadow({ mode: 'open' })
    this._hass = null
    this._cfg  = {}

    // State
    this._room          = ROOMS[0].id
    this._view          = 'player'          // 'player' | 'browse'
    this._sheet         = null              // null | 'queue' | 'group' | 'picker'
    this._pendingPlay   = null
    this._queue         = []
    this._queueBusy     = false
    this._browseStack   = []
    this._browseLoading = false
    this._searchQuery   = ''
    this._searchFilter  = 'all'             // 'all' | 'track' | 'album' | 'artist' | 'playlist'
    this._searchResults = null
    this._searchTimer   = null
    this._bgCurrent     = null
    this._bgFading      = false
    this._maEntryId     = null              // cached MA config entry ID
    this._init          = false
  }

  setConfig(cfg = {}) {
    this._cfg = cfg
    // Allow rooms override from YAML config
    if (cfg.rooms) {
      this._rooms = cfg.rooms
    } else {
      this._rooms = ROOMS
    }
  }

  get _allMass()  { return this._rooms.filter(r => !r.sonosOnly).map(r => r.mass) }
  get _allSonos() { return this._rooms.map(r => r.sonos) }

  set hass(hass) {
    this._hass = hass
    if (!this._init) { this._mount(); this._init = true }
    this._updateBg()
    this._renderPlayer()
    this._renderTabbar()
  }

  /* ── Mount ──────────────────────────────────────────────────────────── */
  _mount() {
    this._root.innerHTML = `<style>${CSS}</style>
    <div class="app" id="app">
      <div class="bg" id="bg"></div>
      <div class="overlay"></div>
      <div class="content">
        <div class="view" id="player-view"></div>
        <div class="view browse-view" id="browse-view" style="display:none"></div>
      </div>
      <div class="tabbar" id="tabbar"></div>
    </div>`
  }

  /* ── Background ─────────────────────────────────────────────────────── */
  _updateBg() {
    const art = this._artUrl()
    if (art === this._bgCurrent || this._bgFading) return
    const bg = this._$('bg')
    if (!bg) return
    this._bgFading = true
    bg.classList.add('fade')
    setTimeout(() => {
      bg.style.backgroundImage = art ? `url(${art})` : 'none'
      bg.classList.remove('fade')
      this._bgCurrent = art
      this._bgFading  = false
    }, 360)
  }

  /* ── Player view ────────────────────────────────────────────────────── */
  _renderPlayer() {
    const el = this._$('player-view')
    if (!el || this._view !== 'player') return

    const room   = this._room_()
    const massS  = this._hass?.states[room.mass]
    const attr   = massS?.attributes || {}
    const state  = massS?.state || 'idle'
    const playing = state === 'playing'

    const title   = attr.media_title  || ''
    const artist  = attr.media_artist || attr.media_album_name || ''
    const vol     = Math.round((attr.volume_level ?? 0.5) * 100)
    const shuffle = !!attr.shuffle
    const repeat  = attr.repeat || 'off'
    const art     = this._artUrl()

    const isLineIn = attr.source === 'Line-in'
    const srcLabel = attr.source && attr.source !== 'Music Assistant Queue' && attr.source !== 'Line-in'
      ? attr.source : ''

    el.innerHTML = `
      <div class="now-room">${this._esc(room.label)}${srcLabel ? ' · ' + this._esc(srcLabel) : ''}</div>

      <div class="art-wrap">
        ${art ? `<img src="${art}" alt="">` : `<div class="art-placeholder">${I.note}</div>`}
      </div>

      ${room.hasLineIn ? (isLineIn ? `
        <div class="linein-banner">
          <div style="display:flex;align-items:center">
            <div class="linein-dot"></div>
            <div style="margin-left:9px">
              <div class="linein-text">Vinyl / Line-in active</div>
              <div class="linein-sub">Record player playing</div>
            </div>
          </div>
          <button class="linein-btn" id="btn-li-off">Switch to Queue</button>
        </div>` : `
        <div class="vinyl-row">
          <div class="vinyl-lbl">${I.vinyl} Record Player</div>
          <button class="vinyl-btn" id="btn-li-on">Switch to Line-in</button>
        </div>`) : ''}

      <div class="track-row">
        <div class="track-info">
          <div class="track-title">${this._esc(title || (state === 'idle' ? 'Nothing playing' : 'Loading…'))}</div>
          ${artist ? `<div class="track-artist">${this._esc(artist)}</div>` : ''}
        </div>
        <div class="ctrl-btns">
          <button class="ctrl-btn${shuffle ? ' on' : ''}" id="btn-shuf" aria-label="Shuffle">${I.shuffle}</button>
          <button class="ctrl-btn${repeat !== 'off' ? ' on' : ''}" id="btn-rep" aria-label="Repeat">${repeat === 'one' ? I.repeat1 : I.repeat}</button>
        </div>
      </div>

      <div class="vol-row">
        <span class="vol-icon">${I.volLo}</span>
        <input type="range" id="vol" min="0" max="100" value="${vol}"
          style="background:linear-gradient(to right,${P.accent} ${vol}%,${P.surface} ${vol}%)">
        <span class="vol-icon">${I.volHi}</span>
      </div>

      <div class="transport">
        <button class="t-btn" id="btn-prev" aria-label="Previous">${I.prev}</button>
        <button class="play-btn" id="btn-play" aria-label="${playing ? 'Pause' : 'Play'}">${playing ? I.pause : I.play}</button>
        <button class="t-btn" id="btn-next" aria-label="Next">${I.next}</button>
      </div>

      <div class="bottom-row">
        <button class="bottom-btn" id="btn-queue">${I.queue} Queue</button>
        <button class="bottom-btn" id="btn-browse">${I.browse} Browse</button>
      </div>`

    /* Events */
    this._ev('btn-li-on',  () => { haptic('medium'); this._svc('select_source', { source: 'Line-in' }) })
    this._ev('btn-li-off', () => { haptic('medium'); this._svc('select_source', { source: 'Music Assistant Queue' }) })
    this._ev('btn-play',   () => { haptic('light'); this._svc(playing ? 'media_pause' : 'media_play') })
    this._ev('btn-prev',   () => { haptic('light'); this._svc('media_previous_track') })
    this._ev('btn-next',   () => { haptic('light'); this._svc('media_next_track') })
    this._ev('btn-shuf',   () => { haptic('light'); this._svc('shuffle_set', { shuffle: !shuffle }) })
    this._ev('btn-rep',    () => {
      haptic('light')
      this._svc('repeat_set', { repeat: repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off' })
    })
    this._ev('btn-queue',  () => { haptic('light'); this._openQueue() })
    this._ev('btn-browse', () => { haptic('light'); this._goToBrowse() })

    const volEl = this._root.getElementById('vol')
    volEl?.addEventListener('input', e => {
      const v = +e.target.value
      e.target.style.background = `linear-gradient(to right,${P.accent} ${v}%,${P.surface} ${v}%)`
    })
    volEl?.addEventListener('change', e => {
      haptic('light')
      this._hass.callService('media_player', 'volume_set',
        { volume_level: +e.target.value / 100 },
        { entity_id: this._room_().mass })
    })
  }

  /* ── Browse / Search view ────────────────────────────────────────────── */
  _goToBrowse() {
    this._view = 'browse'
    this._showView('browse')
    this._renderBrowse()
  }

  _renderBrowse() {
    const el = this._$('browse-view')
    if (!el) return

    const atRoot  = this._browseStack.length === 0
    const current = this._browseStack[this._browseStack.length - 1]

    el.innerHTML = `
      <div class="browse-header">
        ${!atRoot
          ? `<button class="browse-back" id="btn-bb" aria-label="Back">${I.back}</button>`
          : ''}
        <div class="browse-title">${atRoot ? 'Browse' : this._esc(current?.title || '')}</div>
        <button style="padding:6px 10px;border-radius:8px;background:${P.card};border:1px solid ${P.border};font-size:12px;font-weight:600;color:${P.sub}" id="btn-np">Now Playing</button>
      </div>

      <div class="search-wrap">
        <span class="search-icon">${I.search}</span>
        <input class="search-input" id="s-in" type="text" inputmode="search"
          placeholder="Search music…" value="${this._esc(this._searchQuery)}" autocomplete="off">
        ${this._searchQuery ? `<button class="search-clear" id="btn-sc" aria-label="Clear">${I.close}</button>` : ''}
      </div>

      ${this._searchQuery ? `
        <div class="filter-pills">
          ${['all','track','album','artist','playlist'].map(t =>
            `<button class="fpill${this._searchFilter === t ? ' on' : ''}" data-filter="${t}">${t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}</button>`
          ).join('')}
        </div>` : ''}

      <div class="browse-body" id="browse-body">
        ${this._browseLoading ? '<div class="spinner"></div>'
          : this._searchQuery  ? this._htmlSearch()
          : atRoot             ? this._htmlRoot()
          : this._htmlLevel(current)}
      </div>`

    this._ev('btn-bb', () => { this._browseStack.pop(); this._renderBrowse() })
    this._ev('btn-np', () => { this._view = 'player'; this._showView('player'); this._renderPlayer() })
    this._ev('btn-sc', () => { this._searchQuery = ''; this._searchResults = null; this._searchFilter = 'all'; this._renderBrowse() })

    // Filter pills
    el.querySelectorAll('[data-filter]').forEach(b => {
      b.addEventListener('click', () => {
        this._searchFilter = b.dataset.filter
        const body = this._$('browse-body')
        if (body) body.innerHTML = this._htmlSearch()
        this._bindBrowse()
        // Re-highlight active pill
        el.querySelectorAll('[data-filter]').forEach(p =>
          p.classList.toggle('on', p.dataset.filter === this._searchFilter))
      })
    })

    // Search input
    const si = this._root.getElementById('s-in')
    si?.focus()
    si?.addEventListener('input', e => {
      this._searchQuery = e.target.value.trim()
      clearTimeout(this._searchTimer)
      if (!this._searchQuery) {
        this._searchResults = null
        this._searchFilter  = 'all'
        const body = this._$('browse-body')
        if (body) { body.innerHTML = this._htmlRoot(); this._bindBrowse() }
        // Remove filter pills
        el.querySelector('.filter-pills')?.remove()
        this._ev('btn-sc', null) // cleanup
        return
      }
      // Show pills immediately
      if (!el.querySelector('.filter-pills')) {
        const wrap = el.querySelector('.search-wrap')
        const pills = document.createElement('div')
        pills.className = 'filter-pills'
        pills.innerHTML = ['all','track','album','artist','playlist'].map(t =>
          `<button class="fpill${this._searchFilter === t ? ' on' : ''}" data-filter="${t}">${t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}</button>`
        ).join('')
        wrap.insertAdjacentElement('afterend', pills)
        pills.querySelectorAll('[data-filter]').forEach(b => {
          b.addEventListener('click', () => {
            this._searchFilter = b.dataset.filter
            const body = this._$('browse-body')
            if (body) body.innerHTML = this._htmlSearch()
            this._bindBrowse()
            pills.querySelectorAll('[data-filter]').forEach(p =>
              p.classList.toggle('on', p.dataset.filter === this._searchFilter))
          })
        })
      }
      const body = this._$('browse-body')
      if (body) body.innerHTML = '<div class="spinner"></div>'
      this._searchTimer = setTimeout(() => this._doSearch(), 380)
    })

    this._bindBrowse()
  }

  _bindBrowse() {
    this._root.querySelectorAll('[data-browse]').forEach(el => {
      el.addEventListener('click', () => {
        haptic('light')
        try { this._doBrowse(JSON.parse(decodeURIComponent(el.dataset.browse))) }
        catch (e) { console.error('browse', e) }
      })
    })
    this._root.querySelectorAll('[data-play]').forEach(el => {
      el.addEventListener('click', ev => {
        ev.stopPropagation()
        haptic('medium')
        try { this._confirmPlay(JSON.parse(decodeURIComponent(el.dataset.play))) }
        catch (e) { console.error('play', e) }
      })
    })
  }

  _htmlRoot() {
    const sections = [
      { id: 'playlists', label: 'Playlists', sub: 'Your saved playlists' },
      { id: 'albums',    label: 'Albums',    sub: 'Browse your albums'   },
      { id: 'artists',   label: 'Artists',   sub: 'Browse by artist'     },
      { id: 'tracks',    label: 'Tracks',    sub: 'All tracks'           },
    ]
    return `<p class="section-lbl">Library</p><div class="browse-body" style="padding-bottom:0">` +
      sections.map(s => {
        const bd = this._enc({ contentId: s.id, contentType: 'music_assistant', label: s.label })
        return `<div class="list-item" data-browse="${bd}">
          <div class="list-thumb">${I.browse}</div>
          <div class="list-info">
            <div class="list-name">${s.label}</div>
            <div class="list-sub">${s.sub}</div>
          </div>
          <div style="color:${P.muted}">${I.back}</div>
        </div>`
      }).join('') + `</div>`
  }

  _htmlLevel(level) {
    const items = level?.items || []
    if (!items.length) return `<div class="empty"><b>Nothing here</b>Try a different section</div>`

    const isTrackList = items[0]?.media_content_type === 'music' && !items[0]?.can_expand
    if (isTrackList) {
      return `<div>` + items.map(item => {
        const ep = this._enc({ contentId: item.media_content_id, contentType: item.media_content_type, name: item.title })
        return `<div class="list-item">
          <div class="list-thumb">${item.thumbnail ? `<img src="${this._esc(item.thumbnail)}" loading="lazy">` : I.note}</div>
          <div class="list-info"><div class="list-name">${this._esc(item.title)}</div></div>
          <button class="list-play" data-play="${ep}">&#9654;</button>
        </div>`
      }).join('') + `</div>`
    }

    return `<div class="browse-grid">` + items.map(item => {
      const bd = this._enc({ contentId: item.media_content_id, contentType: item.media_content_type, label: item.title })
      const ep = this._enc({ contentId: item.media_content_id, contentType: item.media_content_type, name: item.title })
      return `<div class="grid-item"${item.can_expand ? ` data-browse="${bd}"` : ''}>
        <div class="grid-art">
          ${item.thumbnail ? `<img src="${this._esc(item.thumbnail)}" loading="lazy">` : `${I.note}`}
          ${item.can_play ? `<button class="grid-play" data-play="${ep}">&#9654;</button>` : ''}
        </div>
        <div class="grid-info">
          <div class="grid-name">${this._esc(item.title)}</div>
        </div>
      </div>`
    }).join('') + `</div>`
  }

  _htmlSearch() {
    if (!this._searchResults) return '<div class="spinner"></div>'
    const all = this._searchResults
    if (!all.length) return `<div class="empty"><b>No results</b>Try different keywords</div>`

    const filterType = this._searchFilter
    const filtered = filterType === 'all' ? all : all.filter(i =>
      (i._resultType || i.media_type || '').replace(/s$/, '') === filterType.replace(/s$/, ''))

    if (!filtered.length) return `<div class="empty"><b>No ${filterType} results</b></div>`

    // Group by type
    const groups = {}
    for (const item of filtered) {
      const t = (item._resultType || item.media_type || 'track').replace(/s$/, '')
      if (!groups[t]) groups[t] = []
      groups[t].push(item)
    }

    return Object.entries(groups).map(([type, items]) => {
      const label = type.charAt(0).toUpperCase() + type.slice(1) + 's'
      return `<p class="section-lbl">${label}</p><div>` +
        items.map(item => {
          const canDrill = type !== 'track'
          const bd = this._enc({ contentId: item.uri, contentType: item.media_type || 'music_assistant', label: item.name, isUri: true })
          const ep = this._enc({ contentId: item.uri, contentType: item.media_type || 'music', name: item.name, isUri: true })
          const thumb = item.image
            ? `<img src="${this._esc(item.image)}" loading="lazy">`
            : I.note
          return `<div class="list-item"${canDrill ? ` data-browse="${bd}"` : ''}>
            <div class="list-thumb">${thumb}</div>
            <div class="list-info">
              <div class="list-name">${this._esc(item.name)}</div>
              ${item.artists?.length ? `<div class="list-sub">${this._esc(item.artists.map(a => a.name).join(', '))}</div>` : ''}
              ${item.year ? `<div class="list-sub">${item.year}</div>` : ''}
            </div>
            <button class="list-play" data-play="${ep}">&#9654;</button>
          </div>`
        }).join('') + `</div>`
    }).join('')
  }

  /* ── Browse API calls ───────────────────────────────────────────────── */
  async _doBrowse(data) {
    this._searchQuery   = ''
    this._searchResults = null
    this._browseLoading = true
    this._browseStack.push({ title: data.label || data.name || 'Browse', items: [] })
    this._renderBrowse()
    try {
      const res = await this._hass.connection.sendMessagePromise({
        type: 'media_player/browse_media',
        entity_id: this._room_().mass,
        media_content_id: data.contentId,
        media_content_type: data.isUri ? 'music_assistant' : data.contentType,
      })
      this._browseStack[this._browseStack.length - 1].items = res?.children || []
    } catch (e) {
      console.error('Browse error', e)
      this._browseStack[this._browseStack.length - 1].items = []
    }
    this._browseLoading = false
    this._renderBrowse()
  }

  async _doSearch() {
    if (!this._searchQuery) return
    this._searchResults = null
    const body = this._$('browse-body')
    if (body) body.innerHTML = '<div class="spinner"></div>'
    try {
      const res = await this._hass.connection.sendMessagePromise({
        type: 'call_service',
        domain: 'music_assistant',
        service: 'search',
        service_data: {
          config_entry_id: this._maEntry(),
          name: this._searchQuery,
          media_type: ['track', 'album', 'artist', 'playlist'],
          limit: 10,
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
    } catch (e) {
      console.error('Search error', e)
      this._searchResults = []
    }
    if (this._searchQuery && body) {
      body.innerHTML = this._htmlSearch()
      this._bindBrowse()
    }
  }

  /* ── Play confirm / room picker ─────────────────────────────────────── */
  _confirmPlay(item) {
    // If only one room, play directly
    if (this._rooms.length === 1) {
      this._playInRoom(this._rooms[0], item)
      return
    }
    this._pendingPlay = item
    this._sheet = 'picker'
    this._renderSheet()
  }

  _playInRoom(room, item) {
    item = item || this._pendingPlay
    if (!item) return
    haptic('medium')
    if (item.isUri) {
      this._hass.callService('music_assistant', 'play_media',
        { media_id: item.contentId, media_type: item.contentType, enqueue: 'replace' },
        { entity_id: room.mass })
    } else {
      this._hass.callService('media_player', 'play_media',
        { media_content_id: item.contentId, media_content_type: item.contentType || 'music' },
        { entity_id: room.mass })
    }
    this._room = room.id
    this._sheet = null
    this._pendingPlay = null
    this._closeSheet()
    this._view = 'player'
    this._showView('player')
    this._renderPlayer()
    this._renderTabbar()
    this._updateBg()
  }

  /* ── Tab bar ────────────────────────────────────────────────────────── */
  _renderTabbar() {
    const el = this._$('tabbar')
    if (!el) return
    el.innerHTML = this._rooms.map(r => {
      const active  = this._room === r.id
      const playing = this._hass?.states[r.mass]?.state === 'playing'
      return `<button class="tab${active ? ' active' : ''}" data-rid="${r.id}" aria-label="${r.label}">
        <div class="tab-bar"></div>
        ${playing && !active ? '<div class="tab-pip"></div>' : ''}
        ${active && playing ? this._miniBars() : ''}
        <span>${r.label}</span>
      </button>`
    }).join('') +
      `<button class="grp-tab" id="btn-grp" aria-label="Group speakers">${I.group}<span>Group</span></button>`

    el.querySelectorAll('.tab[data-rid]').forEach(b => {
      b.addEventListener('click', () => {
        haptic('light')
        this._room = b.dataset.rid
        this._updateBg()
        if (this._view === 'player') this._renderPlayer()
        else this._renderBrowse()
        this._renderTabbar()
      })
    })
    this._ev('btn-grp', () => { haptic('medium'); this._openGroup() })
  }

  /* ── Sheet: Queue ───────────────────────────────────────────────────── */
  _openQueue() {
    this._sheet = 'queue'
    this._renderSheet()
    this._loadQueue()
  }

  async _loadQueue() {
    this._queueBusy = true
    this._renderSheet()
    try {
      const playerId = this._room_().mass.replace('media_player.', '')
      const res = await this._hass.connection.sendMessagePromise({ type: 'mass/queue_items', player_id: playerId })
      this._queue = res?.items || []
    } catch {
      this._queue = []
    }
    this._queueBusy = false
    this._renderSheet()
  }

  /* ── Sheet: Group ───────────────────────────────────────────────────── */
  _openGroup() {
    this._sheet = 'group'
    this._renderSheet()
  }

  /* ── Sheet renderer ─────────────────────────────────────────────────── */
  _renderSheet() {
    // Remove existing
    this._root.getElementById('bd')?.remove()
    this._root.getElementById('sh')?.remove()
    if (!this._sheet) return

    const app = this._$('app')
    const bd  = document.createElement('div')
    bd.className = 'backdrop'; bd.id = 'bd'
    bd.addEventListener('click', () => this._closeSheet())
    app.appendChild(bd)

    const sh = document.createElement('div')
    sh.className = 'sheet'; sh.id = 'sh'

    if (this._sheet === 'picker') {
      this._sheetPicker(sh)
    } else if (this._sheet === 'group') {
      this._sheetGroup(sh)
    } else {
      this._sheetQueue(sh)
    }
    app.appendChild(sh)
  }

  _sheetPicker(sh) {
    const item = this._pendingPlay
    const rows = this._rooms.map(r => {
      const s    = this._hass?.states[r.mass]
      const play = s?.state === 'playing'
      const cur  = this._room === r.id
      const vol  = Math.round((s?.attributes?.volume_level || 0) * 100)
      const meta = play ? `Playing · ${vol}%` : s?.state === 'paused' ? 'Paused' : 'Idle'
      return `<div class="room-row" data-room="${r.id}">
        <div class="room-pip${play ? ' on' : ''}"></div>
        <div style="flex:1">
          <div class="room-name">${r.label}${cur ? ' <span style="font-size:10px;color:' + P.muted + '">· active</span>' : ''}</div>
          <div class="room-state">${meta}</div>
        </div>
        <div style="color:${P.muted};font-size:18px">&#9654;</div>
      </div>`
    }).join('')

    sh.innerHTML = `
      <div class="sh-pill-wrap"><div class="sh-pill"></div></div>
      <div class="sh-head">
        <span class="sh-title">Play in room</span>
        <button class="sh-x" id="sh-x">${I.close}</button>
      </div>
      <div class="sh-body">
        ${item ? `<div style="padding:8px 18px 2px;font-size:12px;color:${P.muted}">${this._esc(item.name || '')}</div>` : ''}
        ${rows}
        <div style="padding:12px 18px">
          <button class="act-btn muted" id="sh-cancel" style="width:100%;text-align:center">
            <div class="act-lbl muted">Cancel</div>
          </button>
        </div>
      </div>`

    sh.querySelector('#sh-x').addEventListener('click', () => { this._pendingPlay = null; this._closeSheet() })
    sh.querySelector('#sh-cancel').addEventListener('click', () => { this._pendingPlay = null; this._closeSheet() })
    sh.querySelectorAll('[data-room]').forEach(el => {
      el.addEventListener('click', () => {
        const room = this._rooms.find(r => r.id === el.dataset.room)
        if (room) this._playInRoom(room, item)
      })
    })
  }

  _sheetGroup(sh) {
    // Use Sonos group_members for grouping state (most accurate)
    const masterSonos = this._room_().sonos
    const masterState = this._hass?.states[masterSonos]
    const members     = masterState?.attributes?.group_members || [masterSonos]

    const rows = this._rooms.map(r => {
      const s       = this._hass?.states[r.mass]
      const playing = ['playing','paused'].includes(s?.state)
      const vol     = Math.round((s?.attributes?.volume_level || 0) * 100)
      const cur     = r.id === this._room
      const inGroup = members.includes(r.sonos)
      const meta    = playing ? `${s.state === 'playing' ? 'Playing' : 'Paused'} · ${vol}%` : 'Idle'

      return `<div class="room-row" style="${cur ? 'background:' + P.card : ''}">
        <div class="room-pip${playing ? ' on' : ''}"></div>
        <div style="flex:1">
          <div class="room-name">${r.label}${cur ? ` <span style="font-size:10px;color:${P.muted}">· here</span>` : ''}</div>
          <div class="room-state">${meta}</div>
        </div>
        ${!cur ? (inGroup
          ? `<button class="room-action on" data-unjoin="${r.sonos}">Remove</button>`
          : `<button class="room-action" data-join="${r.sonos}">Add</button>`)
          : ''}
      </div>`
    }).join('')

    sh.innerHTML = `
      <div class="sh-pill-wrap"><div class="sh-pill"></div></div>
      <div class="sh-head">
        <span class="sh-title">Speakers</span>
        <button class="sh-x" id="sh-x">${I.close}</button>
      </div>
      <div style="padding:6px 18px 4px;font-size:11px;color:${P.muted};letter-spacing:.06em;text-transform:uppercase;border-bottom:1px solid ${P.border}">Add or remove from group</div>
      <div class="sh-body">${rows}</div>
      <div class="act-grid">
        <button class="act-btn accent" id="act-whole"><div class="act-lbl accent">Whole House</div><div class="act-sub">All speakers</div></button>
        <button class="act-btn" id="act-ung"><div class="act-lbl">Ungroup All</div><div class="act-sub">Independent</div></button>
        <button class="act-btn danger" id="act-stop"><div class="act-lbl danger">Stop All</div><div class="act-sub">Pause everything</div></button>
        <button class="act-btn muted" id="act-close"><div class="act-lbl muted">Close</div></button>
      </div>`

    sh.querySelector('#sh-x').addEventListener('click', () => this._closeSheet())
    sh.querySelector('#act-close').addEventListener('click', () => this._closeSheet())
    sh.querySelector('#act-whole').addEventListener('click', () => {
      haptic('medium')
      this._hass.callService('media_player', 'join',
        { group_members: this._allSonos },
        { entity_id: masterSonos })
      setTimeout(() => { this._sheet = 'group'; this._renderSheet() }, 700)
    })
    sh.querySelector('#act-ung').addEventListener('click', () => {
      haptic('medium')
      this._hass.callService('media_player', 'unjoin', {}, { entity_id: this._allSonos })
      this._closeSheet()
    })
    sh.querySelector('#act-stop').addEventListener('click', () => {
      haptic('heavy')
      this._hass.callService('media_player', 'media_pause', {}, { entity_id: this._allMass })
      this._closeSheet()
    })
    sh.querySelectorAll('[data-join]').forEach(btn => {
      btn.addEventListener('click', () => {
        haptic('light')
        this._hass.callService('media_player', 'join',
          { group_members: [masterSonos, btn.dataset.join] },
          { entity_id: masterSonos })
        setTimeout(() => { this._sheet = 'group'; this._renderSheet() }, 700)
      })
    })
    sh.querySelectorAll('[data-unjoin]').forEach(btn => {
      btn.addEventListener('click', () => {
        haptic('light')
        this._hass.callService('media_player', 'unjoin', {}, { entity_id: [btn.dataset.unjoin] })
        setTimeout(() => { this._sheet = 'group'; this._renderSheet() }, 700)
      })
    })
  }

  _sheetQueue(sh) {
    const count = this._queue.length
    sh.innerHTML = `
      <div class="sh-pill-wrap"><div class="sh-pill"></div></div>
      <div class="sh-head">
        <span class="sh-title">Queue · ${this._room_().label}</span>
        <div style="display:flex;align-items:center;gap:10px">
          <span class="sh-meta">${count} track${count !== 1 ? 's' : ''}</span>
          <button style="font-size:12px;font-weight:600;color:${P.sub};padding:5px 10px;border-radius:7px;background:${P.card};border:1px solid ${P.border}" id="sh-ref">Refresh</button>
          <button class="sh-x" id="sh-x">${I.close}</button>
        </div>
      </div>
      <div class="sh-body">
        ${this._queueBusy ? '<div class="spinner"></div>'
          : !count ? `<div class="empty"><b>Queue is empty</b>Browse and add something</div>`
          : this._queue.map((item, i) => `
            <div class="q-item${item.active ? ' current' : ''}">
              <div class="q-num${item.active ? ' current' : ''}">${item.active ? '&#9654;' : i + 1}</div>
              <div class="q-art">
                ${item.image ? `<img src="${this._esc(item.image)}" loading="lazy">` : I.note}
              </div>
              <div style="flex:1;min-width:0">
                <div class="q-name${item.active ? ' current' : ''}">${this._esc(item.name || 'Unknown')}</div>
                ${item.artists?.[0]?.name ? `<div class="q-artist">${this._esc(item.artists[0].name)}</div>` : ''}
              </div>
              ${item.duration ? `<div class="q-dur">${this._dur(item.duration)}</div>` : ''}
            </div>`).join('')}
      </div>`

    sh.querySelector('#sh-x').addEventListener('click', () => this._closeSheet())
    sh.querySelector('#sh-ref')?.addEventListener('click', () => { haptic('light'); this._loadQueue() })
  }

  _closeSheet() {
    this._sheet = null
    this._renderSheet()
  }

  /* ── Helpers ────────────────────────────────────────────────────────── */
  _showView(w) {
    const pv = this._$('player-view')
    const bv = this._$('browse-view')
    if (!pv || !bv) return
    pv.style.display = w === 'player' ? 'flex' : 'none'
    bv.style.display = w === 'browse' ? 'flex' : 'none'
  }

  _room_()    { return this._rooms.find(r => r.id === this._room) || this._rooms[0] }

  _artUrl() {
    const pic = this._hass?.states[this._room_()?.mass]?.attributes?.entity_picture
    if (!pic) return null
    return pic.startsWith('http') ? pic : `${location.protocol}//${location.hostname}:8123${pic}`
  }

  // Consolidated service call — always goes to MA entity
  _svc(service, data = {}) {
    haptic('light')
    this._hass.callService('media_player', service, data, { entity_id: this._room_().mass })
  }

  _maEntry() {
    if (this._maEntryId) return this._maEntryId
    const ent = Object.values(this._hass?.entities || {}).find(e => e.platform === 'music_assistant')
    if (!ent) return ''
    const dev = this._hass?.devices?.[ent.device_id]
    this._maEntryId = dev?.config_entries?.[0] || ''
    return this._maEntryId
  }

  _$(id)      { return this._root.getElementById(id) }
  _ev(id, fn) {
    const el = this._$(id)
    if (!el || !fn) return
    el.addEventListener('click', fn)
  }
  _esc(s)  { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
  _enc(o)  { return encodeURIComponent(JSON.stringify(o)) }
  _dur(s)  { return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` }
  _miniBars() {
    return `<div class="mini-bars">${[.5,1,.65,.9,.4].map((h, i) =>
      `<div class="mini-bar" style="height:${h*100}%;animation-delay:${i*.13}s"></div>`).join('')}</div>`
  }
}

window.customCards = window.customCards || []
window.customCards.push({ type: 'ha-audio-card', name: 'Home Audio Card', description: 'Custom audio panel' })
if (!customElements.get('ha-audio-card')) customElements.define('ha-audio-card', HaAudioCard)
