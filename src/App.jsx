import { useState } from "react";
import Login from "./Login";
import Home from "./Home";

function App() {
  const [user, setUser] = useState(null);

  return user ? <Home user={user} /> : <Login setUser={setUser} />;
}

export default App;