# Wireframes

Low-fidelity layouts of the implemented screens. The real UI is glassmorphic and
themed; these show structure and hierarchy.

## Main board — desktop / web

```
┌───────────────────────────────────────────────────────────────────────┐
│ ╭─ glass header ────────────────────────────────────────────────────╮  │
│ │ 🎚 Soundboard  [ 🔍 Search name, tag, category… ] ☆ │Random│ Stop  │  │
│ │                                     🎙 📊 ⚙                        │  │
│ │ [Recent] A–Z  Most played  Newest              Grid 2 3 [4] 5 6   │  │
│ ╰────────────────────────────────────────────────────────────────────╯ │
│                                                                         │
│ (All 12) (📣 Air Horns 1) (🎮 Gaming 2) (🎵 Music 3) (👏 Applause) (+)  │
│                                                                         │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                            │
│ │📣    ★ │ │👏    ★ │ │🪙    ★ │ │🫧    ☆ │   ← gradient tiles         │
│ │        │ │        │ │        │ │        │     icon + star             │
│ │Air Horn│ │Applause│ │  Coin  │ │  Pop   │   ← title / subtitle        │
│ │▁▂▅▇▅▂  │ │▁▃▆▇▆▃  │ │▂▅▇▅▂   │ │▁▂▃▂▁   │   ← waveform                │
│ │0:00  ⌨1│ │0:01  ⌨2│ │0:00  ⌨6│ │0:00    │   ← duration / hotkey       │
│ └────────┘ └────────┘ └────────┘ └────────┘                            │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌ ─ ─ ─ ┐                             │
│ │  ...   │ │  ...   │ │  ...   │    +  Add                              │
│ └────────┘ └────────┘ └────────┘ └ ─ ─ ─ ┘                             │
│                                                                         │
│         ╭─ floating mixer (appears while playing) ─────────╮            │
│         │ ● 2 playing        🔊▬▬●▬  Stop all           ▼ │            │
│         │ Air Horn      ▬▬▬●▬▬  ⏹                          │            │
│         │ Applause      ▬▬▬▬●▬  ⏹                          │            │
│         ╰────────────────────────────────────────────────╯            │
└───────────────────────────────────────────────────────────────────────┘
```

## Main board — phone (portrait)

```
┌─────────────────────┐
│ 🎚 [🔍 Search…] ⚙   │
│ Recent · Grid 3     │
│ (All)(📣)(🎮)(🎵)→  │  swipe chips
├─────────────────────┤
│ ┌─────┐┌─────┐┌────┐│
│ │📣 ★ ││👏 ★ ││🪙  ││  large touch targets
│ │Horn ││Clap ││Coin││
│ │▂▅▇▂ ││▃▆▇▃ ││▅▇▅ ││
│ └─────┘└─────┘└────┘│
│ ┌─────┐┌─────┐┌────┐│
│ │ ... ││ ... ││ +  ││
│ └─────┘└─────┘└────┘│
├─────────────────────┤
│  ● 1 playing   ⏹    │  sticky mini-mixer
└─────────────────────┘
   ← swipe between pages →
```

## Sound editor (right-click / long-press a tile)

```
┌──────────────── Edit sound ─────────────────────────────┐
│ ╭ preview (gradient) ─────────────────────╮  ▶          │
│ │ 📣  Air Horn   ▂▅▇▅▂                     │             │
│ ╰──────────────────────────────────────────╯             │
│ ┌ IDENTITY ────────────┐  ┌ BEHAVIOR + FX ─────────────┐ │
│ │ Title  [Air Horn    ]│  │ Play mode [One][Loop][Hold]│ │
│ │ Sub    [Air Horns   ]│  │ Hotkey    [ F1 ] Clear     │ │
│ │ Emoji [📣] Cat [▾]   │  │ ┌ Effects ────────────────┐ │ │
│ │ Color ● ● ● ● ● ● ●  │  │ │ Volume  ▬▬▬●▬  120%     │ │ │
│ │ Tags  #hype #horn +  │  │ │ Speed   ▬▬●▬▬  1.00×    │ │ │
│ │                      │  │ │ Pitch   ▬▬●▬▬  0 st     │ │ │
│ │                      │  │ │ Fade in/out  ▬●  ▬●     │ │ │
│ │                      │  │ │ [Reverse] [Loop]        │ │ │
│ │                      │  │ └─────────────────────────┘ │ │
│ │                      │  │  ⧉ Duplicate      🗑 Delete  │ │
│ └──────────────────────┘  └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Record · Settings · Stats

```
RECORD                 SETTINGS                    STATS
┌──────────────┐       ┌───────────────────┐       ┌────────────────────┐
│    ( 🎙 )     │       │ Theme ▢▢▢ ▢▢[▣]  │       │ 42  12   9    5    │
│   0:03.4      │       │ Accessibility ⚟   │       │ plays snds pld fav │
│ ● Start / ■   │       │ Feel  ⚟           │       │ 🔥 Most played     │
│ [audio ▶▬▬]  │       │ Backup ⬇ Export   │       │ 1 📣 Air Horn  12  │
│ [name…] Save  │       │        ⬆ Import   │       │ 🕑 Recently played │
└──────────────┘       └───────────────────┘       └────────────────────┘
```
