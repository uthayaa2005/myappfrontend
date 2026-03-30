import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

// 🔗 CHANGE THIS AFTER DEPLOY
const socket = io("https://love-back-x3y9.onrender.com");

export default function Home({ user }) {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [current, setCurrent] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  // 🎵 SEARCH SONG
  const search = async () => {
    try {
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
    } catch (err) {
      console.error(err);
    }
  };

  // 💬 + 🎵 RECEIVE EVENTS
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    socket.on("playSong", (videoId) => {
      setCurrent(videoId);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("playSong");
    };
  }, []);

  // 💬 SEND MESSAGE
  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("sendMessage", `${user}: ${message}`);
    setMessage("");
  };

  // 🎵 PLAY SONG (SYNC)
  const playSong = (videoId) => {
    socket.emit("playSong", videoId);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/bg.jpeg')" }}
    >
      <div className="min-h-screen bg-black/60 p-4 text-white">

        {/* 💖 HEADER */}
        <h1 className="text-3xl text-center font-bold mb-2">
          Uthayaa ❤️ Anu
        </h1>
        <p className="text-center mb-6">
          Our Private Music World 🎵
        </p>

        {/* 🎵 SEARCH */}
        <div className="flex justify-center mb-4">
          <input
            className="p-2 rounded-l text-black w-64"
            placeholder="Search song..."
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={search}
            className="bg-pink-500 px-4 rounded-r"
          >
            Search
          </button>
        </div>

        {/* 🎬 PLAYER */}
        {current && (
          <iframe
            className="rounded-xl shadow-lg mb-4"
            width="100%"
            height="300"
            src={`https://www.youtube.com/embed/${current}?autoplay=1`}
            allowFullScreen
          />
        )}

        {/* 🎵 RESULTS */}
        <div className="grid grid-cols-2 gap-3">
          {videos.map((v) => (
            <div
              key={v.id.videoId}
              onClick={() => playSong(v.id.videoId)}
              className="cursor-pointer bg-white/20 backdrop-blur-md p-2 rounded-lg hover:scale-105 transition"
            >
              <img
                src={v.snippet.thumbnails.medium.url}
                className="rounded"
              />
              <p className="text-sm mt-1">{v.snippet.title}</p>
            </div>
          ))}
        </div>

        {/* 💬 CHAT */}
        <div className="mt-6 bg-white/20 backdrop-blur-lg p-4 rounded-xl">
          <div className="h-40 overflow-y-auto mb-2">
            {chat.map((c, i) => (
              <div
                key={i}
                className="bg-pink-500 text-white p-2 rounded mb-1"
              >
                {c}
              </div>
            ))}
          </div>

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="p-2 w-full text-black rounded"
            placeholder="Type a message ❤️"
          />

          <button
            onClick={sendMessage}
            className="bg-pink-600 px-4 py-2 mt-2 rounded w-full"
          >
            Send ❤️
          </button>
        </div>

      </div>
    </div>
  );
}