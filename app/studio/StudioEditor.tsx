"use client";

import { useMemo, useState } from "react";
import {
  Captions,
  CheckCircle2,
  Clock3,
  Film,
  Folder,
  Gauge,
  HardDrive,
  Layers,
  Music,
  Pause,
  Play,
  Scissors,
  Search,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Square,
  Volume2,
} from "lucide-react";

type AssetType = "video" | "audio" | "music" | "subtitle";

type Asset = {
  id: string;
  name: string;
  type: AssetType;
  duration: string;
  details: string;
  tone: string;
};

type TimelineClip = {
  id: string;
  name: string;
  start: number;
  length: number;
  color: string;
  sourceAssetId: string;
};

type TimelineTrack = {
  id: string;
  name: string;
  role: "video" | "audio" | "music" | "subtitle";
  clips: TimelineClip[];
};

const assets: Asset[] = [
  {
    id: "asset-01",
    name: "Aerial_City_4K.mov",
    type: "video",
    duration: "00:01:24",
    details: "3840x2160 | 25fps | ProRes",
    tone: "from-[#6b5cff] via-[#2a6cff] to-[#0a173a]",
  },
  {
    id: "asset-02",
    name: "Interview_MainCam.mp4",
    type: "video",
    duration: "00:12:09",
    details: "1920x1080 | 30fps | H.264",
    tone: "from-[#ff9a5f] via-[#d05d3d] to-[#30110e]",
  },
  {
    id: "asset-03",
    name: "VO_Segment_A.wav",
    type: "audio",
    duration: "00:03:11",
    details: "48kHz | 24-bit | Mono",
    tone: "from-[#34d399] via-[#0b8f72] to-[#04201f]",
  },
  {
    id: "asset-04",
    name: "Score_Pulse_120bpm.wav",
    type: "music",
    duration: "00:02:42",
    details: "48kHz | Stereo",
    tone: "from-[#f6d365] via-[#f2994a] to-[#3d1e09]",
  },
  {
    id: "asset-05",
    name: "Subtitles_ES_Sync.srt",
    type: "subtitle",
    duration: "00:12:09",
    details: "Spanish | 196 cues",
    tone: "from-[#9ca3af] via-[#4b5563] to-[#111827]",
  },
  {
    id: "asset-06",
    name: "Broll_Product_Closeup.mov",
    type: "video",
    duration: "00:00:34",
    details: "4K UHD | 60fps",
    tone: "from-[#8ec5fc] via-[#4d7cff] to-[#1f3163]",
  },
];

const timelineTracks: TimelineTrack[] = [
  {
    id: "track-v1",
    name: "V1 Main Edit",
    role: "video",
    clips: [
      { id: "clip-01", name: "Aerial Intro", start: 3, length: 16, color: "bg-[#2a6cff]", sourceAssetId: "asset-01" },
      { id: "clip-02", name: "Interview Hook", start: 22, length: 21, color: "bg-[#d05d3d]", sourceAssetId: "asset-02" },
      { id: "clip-03", name: "Product B-Roll", start: 46, length: 10, color: "bg-[#4d7cff]", sourceAssetId: "asset-06" },
    ],
  },
  {
    id: "track-v2",
    name: "V2 Titles & Graphics",
    role: "video",
    clips: [
      { id: "clip-04", name: "Lower Third", start: 25, length: 7, color: "bg-[#7c3aed]", sourceAssetId: "asset-02" },
      { id: "clip-05", name: "CTA Card", start: 50, length: 8, color: "bg-[#b45309]", sourceAssetId: "asset-06" },
    ],
  },
  {
    id: "track-a1",
    name: "A1 Dialogue",
    role: "audio",
    clips: [
      { id: "clip-06", name: "VO Segment A", start: 20, length: 31, color: "bg-[#0b8f72]", sourceAssetId: "asset-03" },
    ],
  },
  {
    id: "track-m1",
    name: "M1 Music",
    role: "music",
    clips: [
      { id: "clip-07", name: "Pulse Bed", start: 8, length: 44, color: "bg-[#f2994a]", sourceAssetId: "asset-04" },
    ],
  },
  {
    id: "track-s1",
    name: "S1 Captions",
    role: "subtitle",
    clips: [
      { id: "clip-08", name: "Spanish Captions", start: 22, length: 35, color: "bg-[#6b7280]", sourceAssetId: "asset-05" },
    ],
  },
];

const visibleSeconds = 60;

const roleBadge: Record<TimelineTrack["role"], string> = {
  video: "V",
  audio: "A",
  music: "M",
  subtitle: "S",
};

function iconForType(type: AssetType) {
  if (type === "video") return <Film size={14} />;
  if (type === "audio") return <Volume2 size={14} />;
  if (type === "music") return <Music size={14} />;
  return <Captions size={14} />;
}

export function StudioEditor() {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[1].id);
  const [selectedClipId, setSelectedClipId] = useState<string>(timelineTracks[0].clips[1].id);
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedAsset = useMemo(() => assets.find((asset) => asset.id === selectedAssetId) ?? assets[0], [selectedAssetId]);

  const selectedClip = (() => {
    for (const track of timelineTracks) {
      const clip = track.clips.find((candidate) => candidate.id === selectedClipId);
      if (clip) return { clip, track };
    }
    return { clip: timelineTracks[0].clips[0], track: timelineTracks[0] };
  })();

  return (
    <main className="min-h-screen bg-[#06070a] text-[#f6f6f7]">
      <div className="mx-auto max-w-[1800px] p-4 sm:p-6">
        <header className="mb-4 rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#151821_0%,#090b10_70%)] px-5 py-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#f6d365]">TOJI Studio</p>
              <h1 className="mt-1 text-xl font-semibold sm:text-2xl">Professional Video Manager Workspace</h1>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-3 py-1 text-emerald-200">Autosave On</span>
              <span className="rounded-full border border-sky-300/30 bg-sky-500/15 px-3 py-1 text-sky-200">Proxy Active</span>
              <span className="rounded-full border border-amber-300/30 bg-amber-500/15 px-3 py-1 text-amber-100">24 FPS Timeline</span>
            </div>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_350px]">
          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-[#10131a] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-[#f6d365]">Assets</p>
                <button className="rounded-full border border-white/15 px-2 py-1 text-xs text-white/80">+ Import</button>
              </div>
              <label className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <Search size={14} className="text-white/60" />
                <input
                  aria-label="Search assets"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-white/40"
                  placeholder="Search by name, tag or codec"
                />
              </label>
              <div className="space-y-2">
                {assets.map((asset) => {
                  const active = selectedAssetId === asset.id;
                  return (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`w-full rounded-xl border p-2 text-left transition ${
                        active
                          ? "border-[#f6d365]/70 bg-[#f6d365]/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/25"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-white/75">
                          {iconForType(asset.type)}
                          {asset.type}
                        </span>
                        <span className="text-[11px] text-white/60">{asset.duration}</span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium">{asset.name}</p>
                      <p className="truncate text-xs text-white/55">{asset.details}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#10131a] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#f6d365]"><Folder size={13} />Gallery</p>
                <span className="text-xs text-white/60">12 shots</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {assets.map((asset) => (
                  <button
                    key={`thumb-${asset.id}`}
                    onClick={() => setSelectedAssetId(asset.id)}
                    className="group overflow-hidden rounded-xl border border-white/10 bg-[#0b0d13] text-left"
                  >
                    <div className={`h-16 w-full bg-gradient-to-br ${asset.tone} transition duration-300 group-hover:scale-105`} />
                    <div className="p-2">
                      <p className="truncate text-[11px] font-medium text-white/85">{asset.name}</p>
                      <p className="text-[10px] text-white/50">Miniature ready</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            <section className="rounded-3xl border border-white/10 bg-[#10131a] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#f6d365]"><Film size={14} />Preview</p>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span className="rounded-md bg-white/8 px-2 py-1">4K Proxy</span>
                  <span className="rounded-md bg-white/8 px-2 py-1">Safe Areas</span>
                  <span className="rounded-md bg-white/8 px-2 py-1">Scopes</span>
                </div>
              </div>
              <div className="relative h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[#04050a] sm:h-[460px]">
                <div className={`absolute inset-0 bg-gradient-to-br ${selectedAsset.tone}`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,0.16),transparent_40%)]" />
                <div className="absolute inset-x-10 top-8 h-9 rounded-lg border border-white/25 bg-black/45" />
                <div className="absolute inset-x-12 top-[4.8rem] h-5 rounded-md border border-white/20 bg-black/35" />
                <div className="absolute left-8 top-1/2 -translate-y-1/2 rounded-lg border border-white/30 bg-black/45 px-3 py-1 text-xs">Cam A</div>
                <div className="absolute bottom-10 left-8 rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-sm">
                  <p className="font-semibold">{selectedClip.clip.name}</p>
                  <p className="text-xs text-white/70">{selectedAsset.name}</p>
                </div>
                <div className="absolute bottom-10 right-8 rounded-lg border border-emerald-300/35 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100">
                  Live subtitle sync
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button className="rounded-full border border-white/20 p-2 text-white/80"><SkipBack size={15} /></button>
                    <button
                      onClick={() => setIsPlaying((prev) => !prev)}
                      className="rounded-full border border-[#f6d365]/60 bg-[#f6d365]/15 p-2 text-[#f6d365]"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button className="rounded-full border border-white/20 p-2 text-white/80"><SkipForward size={15} /></button>
                    <button className="rounded-full border border-white/20 p-2 text-white/80"><Square size={12} /></button>
                  </div>
                  <div className="text-sm font-medium">00:01:12:08 / 00:12:09:00</div>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1"><Volume2 size={13} />-5.6 dB</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1"><Captions size={13} />ES</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#10131a] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#f6d365]"><Layers size={14} />Timeline</p>
                <div className="flex items-center gap-2 text-xs">
                  <button className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-white/75">Snap</button>
                  <button className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-white/75">Ripple</button>
                  <button className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-white/75">Magnetic</button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0b0e14]">
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-[230px_1fr] border-b border-white/10 bg-white/[0.02]">
                    <div className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-white/55">Tracks</div>
                    <div className="px-3 py-2">
                      <div className="flex">
                        {Array.from({ length: 12 }).map((_, index) => (
                          <div key={index} className="w-20 border-l border-white/10 pl-2 text-[11px] text-white/45">
                            {String(index * 5).padStart(2, "0")}s
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {timelineTracks.map((track) => (
                    <div key={track.id} className="grid grid-cols-[230px_1fr] border-b border-white/10 last:border-b-0">
                      <div className="flex items-center gap-3 px-3 py-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">{roleBadge[track.role]}</span>
                        <div>
                          <p className="text-sm font-medium">{track.name}</p>
                          <p className="text-xs text-white/55">Mute | Solo | Lock</p>
                        </div>
                      </div>

                      <div className="relative h-14 px-2 py-2">
                        <div className="absolute inset-y-0 left-2 right-2 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:80px_100%]" />
                        {track.clips.map((clip) => {
                          const left = `${(clip.start / visibleSeconds) * 100}%`;
                          const width = `${(clip.length / visibleSeconds) * 100}%`;
                          const active = selectedClipId === clip.id;
                          return (
                            <button
                              key={clip.id}
                              onClick={() => {
                                setSelectedClipId(clip.id);
                                setSelectedAssetId(clip.sourceAssetId);
                              }}
                              style={{ left, width }}
                              className={`absolute top-2 h-10 rounded-md border px-2 text-left text-xs transition ${clip.color} ${
                                active
                                  ? "border-[#f6d365] ring-2 ring-[#f6d365]/50"
                                  : "border-black/30 hover:border-white/70"
                              }`}
                            >
                              <p className="truncate font-medium text-white">{clip.name}</p>
                              <p className="truncate text-[10px] text-white/80">{clip.start}s - {clip.start + clip.length}s</p>
                            </button>
                          );
                        })}
                        <div className="pointer-events-none absolute bottom-0 top-0 left-[38%] w-0.5 bg-[#f6d365] shadow-[0_0_12px_rgba(246,211,101,0.9)]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/65"><Scissors size={13} />Edit tools</p>
                  <p className="mt-2 text-sm text-white/85">Trim, Ripple, Roll, Slip, Slide and rate stretch available.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/65"><Music size={13} />Audio & music</p>
                  <p className="mt-2 text-sm text-white/85">Dialogue bus, auto-ducking and loudness target: -14 LUFS.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/65"><Captions size={13} />Subtitles</p>
                  <p className="mt-2 text-sm text-white/85">Caption track synced with style presets and timing nudges.</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-white/10 bg-[#10131a] p-4">
              <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#f6d365]"><SlidersHorizontal size={13} />Inspector</p>
              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs uppercase tracking-[0.1em] text-white/55">Selection</p>
                  <p className="mt-1 font-medium">{selectedClip.clip.name}</p>
                  <p className="text-xs text-white/60">Track: {selectedClip.track.name}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs uppercase tracking-[0.1em] text-white/55">Transform</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <span className="rounded-md bg-white/8 px-2 py-1">Position: 0 / 0</span>
                    <span className="rounded-md bg-white/8 px-2 py-1">Scale: 100%</span>
                    <span className="rounded-md bg-white/8 px-2 py-1">Rotation: 0 deg</span>
                    <span className="rounded-md bg-white/8 px-2 py-1">Opacity: 100%</span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs uppercase tracking-[0.1em] text-white/55">Audio chain</p>
                  <div className="mt-2 space-y-2 text-xs">
                    <p className="rounded-md bg-white/8 px-2 py-1">EQ Voice Clarity</p>
                    <p className="rounded-md bg-white/8 px-2 py-1">Compressor Gentle</p>
                    <p className="rounded-md bg-white/8 px-2 py-1">Limiter Broadcast</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#10131a] p-4">
              <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#f6d365]"><Gauge size={13} />Video manager</p>
              <div className="space-y-2 text-sm">
                <div className="rounded-xl border border-emerald-300/25 bg-emerald-500/10 p-3">
                  <p className="inline-flex items-center gap-2 font-medium text-emerald-100"><CheckCircle2 size={14} />Master Sequence Ready</p>
                  <p className="mt-1 text-xs text-emerald-100/80">No dropped frames. Cache optimized.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-white/60"><Clock3 size={13} />Render queue</p>
                  <p className="mt-1 text-sm">1. Teaser vertical 9:16 - In progress (72%)</p>
                  <p className="text-sm">2. Master 4K H.265 - Waiting</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-white/60"><HardDrive size={13} />Media storage</p>
                  <p className="mt-1 text-sm">Used: 428 GB / 1 TB</p>
                  <div className="mt-2 h-2 overflow-hidden rounded bg-white/10">
                    <div className="h-full w-[42%] bg-gradient-to-r from-[#2dd4bf] to-[#f6d365]" />
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
