import { useState } from "react";

export default function Report() {
  const [name, setName] = useState("");
  const [report, setReport] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, report }),
      });
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setMessage("تعذر إرسال البلاغ ❌");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-black p-8 rounded-2xl border border-blue-900 w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-500">
          تقديم بلاغ
        </h2>

        <input
          className="w-full p-2 mb-3 rounded bg-neutral-800"
          placeholder="اسم المبلّغ"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="w-full p-2 mb-3 rounded bg-neutral-800 h-32"
          placeholder="نص البلاغ"
          value={report}
          onChange={(e) => setReport(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded"
        >
          إرسال البلاغ
        </button>

        {message && (
          <p className="text-center mt-3 text-sm text-gray-300">{message}</p>
        )}
      </form>
    </div>
  );
}
