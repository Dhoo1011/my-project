import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setMessage("حدث خطأ في الاتصال بالسيرفر ❌");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
      <form
        onSubmit={handleLogin}
        className="bg-black p-8 rounded-2xl border border-blue-900 w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-500">
          تسجيل الدخول
        </h2>

        <input
          className="w-full p-2 mb-3 rounded bg-neutral-800"
          placeholder="اسم المستخدم"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full p-2 mb-3 rounded bg-neutral-800"
          placeholder="كلمة المرور"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded"
        >
          دخول
        </button>

        {message && (
          <p className="text-center mt-3 text-sm text-gray-300">{message}</p>
        )}
      </form>
    </div>
  );
}
