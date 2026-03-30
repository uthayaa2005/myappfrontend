import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;
const socket = io(API_URL);

const fmt = (s) =>
  s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');

export default function Home({ user }) {
  const [roomId] = useState("uthayaa-anu");
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [current, setCurrent] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [searching, setSearching] = useState(false);
  const chatRef = useRef(null);
  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await axios.get(
        "https://www.googleapis.com/youtube/v3/search",
        {
          params: {
            part: "snippet",
            q: query,
            key: API_KEY,
            maxResults: 6,
            type: "video",
          },
        }
      );
      setVideos(res.data.items);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    socket.emit("joinRoom", roomId);
    socket.on("roomData", (data) => {
      setCurrent(data.currentSong);
      setIsPlaying(data.isPlaying);
    });
    socket.on("receiveMessage", (msg) =>
      setChat((prev) => [...prev, msg])
    );
    socket.on("playSong", (data) => {
      setCurrent(data);
      setIsPlaying(true);
    });
    socket.on("pauseSong", () => setIsPlaying(false));
    socket.on("resumeSong", (data) => {
      setCurrent(data);
      setIsPlaying(true);
    });
    return () => socket.off();
  }, []);

  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("sendMessage", { roomId, msg: `${user}:: ${message}` });
    setMessage("");
  };

  const playSong = (videoId) => {
    socket.emit("playSong", {
      roomId,
      data: { videoId, timestamp: Date.now() },
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0608] text-[#f0e6ea] font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=DM+Sans:wght@300;400;500&display=swap');`}</style>

      <div className="max-w-6xl mx-auto px-5 py-7">

        {/* ── Header ── */}
        <header className="flex items-center justify-between pb-6 mb-7 border-b border-[#b46478]/20">
          <h1
            className="text-3xl font-light tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            our little{" "}
            <span className="text-[#c4607a] italic">room</span>
          </h1>

          <div className="flex items-center gap-2 bg-[#1a1215] border border-[#b46478]/20 rounded-full px-4 py-1.5 text-xs tracking-widest uppercase text-[#f0e6ea]/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            uthayaa &amp; anu
          </div>
        </header>

        {/* ── Body grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* ── LEFT: player + search ── */}
          <div className="flex flex-col gap-5">

            {/* Player card */}
            <div className="relative bg-[#120d0f] border border-[#b46478]/20 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(196,96,122,0.18),transparent_70%)] pointer-events-none z-10" />

              {current ? (
                <iframe
                  className="w-full block"
                  height="300"
                  src={`https://www.youtube.com/embed/${current.videoId}?autoplay=${
                    isPlaying ? 1 : 0
                  }&start=${Math.floor(
                    (Date.now() - current.timestamp) / 1000
                  )}`}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="h-52 flex flex-col items-center justify-center gap-3">
                  <span className="text-4xl opacity-20 animate-bounce">♪</span>
                  <p className="text-sm tracking-widest text-[#f0e6ea]/40 uppercase">
                    search a song to begin
                  </p>
                </div>
              )}

              <div className="flex gap-3 px-4 py-3 border-t border-[#b46478]/20">
                <button
                  onClick={() => socket.emit("pauseSong", roomId)}
                  className="flex-1 py-2.5 rounded-xl border border-[#b46478]/20 bg-[#1a1215] text-sm tracking-wide hover:bg-[rgba(196,96,122,0.15)] hover:border-[#8a3a50] transition-all"
                >
                  ⏸ pause
                </button>
                <button
                  onClick={() => socket.emit("resumeSong", roomId)}
                  className="flex-1 py-2.5 rounded-xl border border-[#b46478]/20 bg-[#1a1215] text-sm tracking-wide hover:bg-[rgba(196,96,122,0.15)] hover:border-[#8a3a50] transition-all"
                >
                  ▶ resume
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div className="flex gap-3">
              <input
                className="flex-1 bg-[#120d0f] border border-[#b46478]/20 rounded-xl px-4 py-2.5 text-sm placeholder-[#f0e6ea]/30 outline-none focus:border-[#8a3a50] transition-colors"
                placeholder="search for a song…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
              />
              <button
                onClick={search}
                className="px-5 py-2.5 bg-[#c4607a] hover:bg-[#d4708a] text-white rounded-xl text-sm tracking-wide transition-colors shrink-0"
              >
                {searching ? "…" : "search"}
              </button>
            </div>

            {/* Results grid */}
            {videos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {videos.map((v) => (
                  <div
                    key={v.id.videoId}
                    onClick={() => playSong(v.id.videoId)}
                    className="bg-[#120d0f] border border-[#b46478]/20 rounded-xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:border-[#8a3a50] hover:shadow-[0_8px_24px_rgba(196,96,122,0.15)] transition-all duration-200"
                  >
                    <img
                      src={v.snippet.thumbnails.medium.url}
                      alt=""
                      className="w-full aspect-video object-cover block"
                    />
                    <p className="px-2.5 py-2 text-[11px] text-[#f0e6ea]/50 leading-snug line-clamp-2">
                      {fmt(v.snippet.title)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: chat sidebar ── */}
          <div className="flex flex-col bg-[#120d0f] border border-[#b46478]/20 rounded-2xl overflow-hidden h-fit lg:max-h-[calc(100vh-120px)]">

            {/* Chat header */}
            <div
              className="px-5 py-4 border-b border-[#b46478]/20 text-[#f0e6ea]/50 tracking-widest font-light flex items-center gap-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.05rem" }}
            >
              <span className="text-[#c4607a]">♡</span> messages
            </div>

            {/* Messages list */}
            <div
              ref={chatRef}
              className="flex flex-col gap-3 p-4 overflow-y-auto min-h-[280px] max-h-[380px] scrollbar-thin scrollbar-thumb-[#8a3a50] scrollbar-track-transparent"
            >
              {chat.length === 0 ? (
                <div
                  className="flex items-center justify-center h-full text-[#f0e6ea]/30 text-sm italic"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  say something sweet…
                </div>
              ) : (
                chat.map((c, i) => {
                  const [sender, ...rest] = c.split("::");
                  const isSelf = sender.trim() === user;
                  return (
                    <div
                      key={i}
                      className={`flex flex-col gap-1 ${
                        isSelf ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="text-[10px] tracking-widest uppercase text-[#c9a96e]">
                        {sender.trim()}
                      </span>
                      <div
                        className={`px-3 py-2 text-[13px] leading-relaxed max-w-[85%] break-words ${
                          isSelf
                            ? "bg-[rgba(196,96,122,0.18)] border border-[#8a3a50] rounded-xl rounded-tr-none"
                            : "bg-[#1a1215] border border-[#b46478]/20 rounded-xl rounded-tl-none"
                        }`}
                      >
                        {rest.join("::").trim()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message input */}
            <div className="flex gap-2 p-3 border-t border-[#b46478]/20">
              <input
                className="flex-1 bg-[#1a1215] border border-[#b46478]/20 rounded-lg px-3 py-2 text-[13px] placeholder-[#f0e6ea]/25 outline-none focus:border-[#8a3a50] transition-colors"
                placeholder="write a message…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="w-9 h-9 shrink-0 bg-[#c4607a] hover:bg-[#d4708a] active:scale-95 rounded-lg flex items-center justify-center transition-all"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}