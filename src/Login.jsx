import { useState } from "react";
import axios from "axios";

export default function Login({ setUser }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const res = await axios.post("https://love-back-x3y9.onrender.com/login", {
      name,
      password
    });

    if (res.data.success) {
      setUser(res.data.name);
    } else {
      alert("Wrong credentials");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-pink-200">
      <div className="bg-white p-6 rounded-xl shadow-xl">
        <h1 className="text-xl mb-4">💖 Login</h1>
        <input
          placeholder="Name"
          className="border p-2 mb-2 w-full"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          className="border p-2 mb-2 w-full"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={login}
          className="bg-pink-500 text-white px-4 py-2 rounded w-full"
        >
          Enter ❤️
        </button>
      </div>
    </div>
  );
}