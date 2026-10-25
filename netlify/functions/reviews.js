const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const store = getStore("prisma-reviews");

  if (event.httpMethod === "GET") {
    try {
      const { blobs } = await store.list();
      const reviews = await Promise.all(
        blobs.map(async (blob) => {
          const data = await store.get(blob.key, { type: "json" });
          return { id: blob.key, ...data };
        })
      );
      reviews.sort((a, b) => b.timestamp - a.timestamp);
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(reviews) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const name = String(body.name || "").trim().slice(0, 40);
      const comment = String(body.comment || "").trim().slice(0, 500);
      const rating = Number(body.rating);

      if (!comment || rating < 1 || rating > 5) {
        return { statusCode: 400, body: JSON.stringify({ error: "Dati non validi" }) };
      }

      const id = `review_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const payload = { name: name || "Anonimo", rating, comment, timestamp: Date.now() };
      await store.setJSON(id, payload);

      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ success: true }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
