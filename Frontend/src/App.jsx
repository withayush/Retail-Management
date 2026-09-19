import { useEffect, useState } from "react";
import { apiClient } from "./api/client";

function App() {
  const [message, setMessage] = useState("Connecting...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const data = await apiClient("/");

        setMessage(data.message);
      } catch (error) {
        console.error(error);
        setError(error.message);
      }
    };

    testConnection();
  }, []);

  return (
    <div>
      <h1>VendorOS Frontend</h1>

      {error ? (
        <p>Backend Error: {error}</p>
      ) : (
        <p>Backend: {message}</p>
      )}
    </div>
  );
}

export default App;