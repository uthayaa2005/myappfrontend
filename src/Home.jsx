import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;
const socket = io(API_URL);

export default function Home({ user }) {
  const [roomId] = useState("uthayaa-anu"); // 💖 private room
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

  // 🏠 JOIN ROOM
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

    socket.on("pauseSong", () => setIsPlaying(false));
    socket.on("resumeSong", () => setIsPlaying(true));

    return () => {
      socket.off();
    };
  }, []);

  // 💬 SEND
  const sendMessage = () => {
    socket.emit("sendMessage", {
      roomId,
      msg: `${user}: ${message}`,
    });
    setMessage("");
  };

  // 🎵 PLAY
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
  const pause = () => socket.emit("pauseSong", roomId);

  // ▶ RESUME
  const resume = () => socket.emit("resumeSong", roomId);

  return (
    <div className="p-4 text-white bg-black min-h-screen">

      <h1 className="text-2xl text-center mb-4">
        💖 Private Music Room
      </h1>

      {/* SEARCH */}
      <input
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search song"
        className="text-black p-2"
      />
      <button onClick={search}>Search</button>

      {/* PLAYER */}
      {current && isPlaying && (
        <iframe
          width="100%"
          height="300"
          src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1&start=${Math.floor(
            (Date.now() - current.timestamp) / 1000
          )}`}
        />
      )}

      {/* CONTROLS */}
      <div className="mt-2">
        <button onClick={pause}>⏸ Pause</button>
        <button onClick={resume}>▶ Resume</button>
      </div>

      {/* RESULTS */}
      {videos.map((v) => (
        <div key={v.id.videoId} onClick={() => playSong(v.id.videoId)}>
          <img src={v.snippet.thumbnails.medium.url} />
          <p>{v.snippet.title}</p>
        </div>
      ))}

      {/* CHAT */}
      <div className="mt-4">
        {chat.map((c, i) => <div key={i}>{c}</div>)}

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="text-black"
        />
        <button onClick={sendMessage}>Send</button>
      </div>

    </div>
  );
}