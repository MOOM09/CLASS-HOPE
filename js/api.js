const API = "http://localhost:3000/instructors";

/* ================= Helper: fetch مع retry ================= */
async function fetchWithRetry(url, options = {}, retries = 5, delay = 400) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        cache: "no-store"
      });
      if (res.ok) return res;
      if (i === retries - 1) return res;
    } catch (err) {
      if (i === retries - 1) throw err;
    }
    await new Promise((r) => setTimeout(r, delay));
  }
}

export async function getInstructor(id) {
  const res = await fetchWithRetry(`${API}/${id}`);
  if (!res.ok) throw new Error("Instructor not found");
  return res.json();
}

export async function saveStudents(id, students) {
  const res = await fetchWithRetry(`${API}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ students }),
  });
  if (!res.ok) throw new Error("Save failed");
  return res.json();
}

export function fetchRandomName() {
  return fetch("https://randomuser.me/api/")
    .then((res) => res.json())
    .then((data) => `${data.results[0].name.first} ${data.results[0].name.last}`);
}