import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;
const socket = io(API_URL);

export default function Home({ user }) {
  const [roomId] = useState("uthayaa-anu");
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [current, setCurrent] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  // 🎵 SEARCH
  const search = async () => {
    const res = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: query,
          key: API_KEY,
          maxResults: 5,
          type: "video",
        },
      }
    );
    setVideos(res.data.items);
  };

  // 🏠 JOIN ROOM + SOCKET EVENTS
  useEffect(() => {
    socket.emit("joinRoom", roomId);

    socket.on("roomData", (data) => {
      setCurrent(data.currentSong);
      setIsPlaying(data.isPlaying);
    });

    socket.on("receiveMessage", (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    socket.on("playSong", (data) => {
      setCurrent(data);
      setIsPlaying(true);
    });

    socket.on("pauseSong", () => {
      setIsPlaying(false);
    });

    socket.on("resumeSong", (data) => {
      setCurrent(data);
      setIsPlaying(true);
    });

    return () => socket.off();
  }, []);

  // 💬 SEND MESSAGE
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      roomId,
      msg: `${user}: ${message}`,
    });

    setMessage("");
  };

  // 🎵 PLAY SONG
  const playSong = (videoId) => {
    socket.emit("playSong", {
      roomId,
      data: {
        videoId,
        timestamp: Date.now(),
      },
    });
  };

  // ⏸ PAUSE
  const pause = () => {
    socket.emit("pauseSong", roomId);
  };

  // ▶ RESUME
  const resume = () => {
    socket.emit("resumeSong", roomId);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">

      <h1 className="text-3xl text-center mb-4">
        💖 Private Music Room
      </h1>

      {/* SEARCH */}
      <div className="flex justify-center mb-4">
        <input
          className="p-2 text-black"
          placeholder="Search song..."
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={search} className="bg-pink-500 px-4">
          Search
        </button>
      </div>

      {/* PLAYER (ALWAYS SHOW) */}
      {current && (
        <iframe
          width="100%"
          height="300"
          src={`https://www.youtube.com/embed/${current.videoId}?autoplay=${
            isPlaying ? 1 : 0
          }&start=${Math.floor(
            (Date.now() - current.timestamp) / 1000
          )}`}
          allow="autoplay"
          allowFullScreen
        />
      )}

      {/* CONTROLS */}
      <div className="flex gap-2 mt-2">
        <button onClick={pause} className="bg-red-500 px-3 py-1">
          ⏸ Pause
        </button>
        <button onClick={resume} className="bg-green-500 px-3 py-1">
          ▶ Resume
        </button>
      </div>

      {/* RESULTS */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {videos.map((v) => (
          <div
            key={v.id.videoId}
            onClick={() => playSong(v.id.videoId)}
            className="cursor-pointer"
          >
            <img src={v.snippet.thumbnails.medium.url} />
            <p className="text-sm">{v.snippet.title}</p>
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div className="mt-6">
        <div className="h-40 overflow-y-auto mb-2">
          {chat.map((c, i) => (
            <div key={i} className="bg-pink-500 p-1 mb-1">
              {c}
            </div>
          ))}
        </div>

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="text-black w-full p-2"
        />

        <button onClick={sendMessage} className="bg-pink-600 w-full mt-2">
          Send ❤️
        </button>
      </div>

    </div>
  );
}