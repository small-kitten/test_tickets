const BASE_URL = "http://127.0.0.1:8000";

export const api = {
  async getAll() {
    const res = await fetch(`${BASE_URL}/tickets`);
    if (!res.ok) throw new Error("Ошибка загрузки списка");
    return res.json();
  },

  async create(problem, author) {
    const res = await fetch(`${BASE_URL}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem, author }),
    });
    if (!res.ok) throw new Error("Ошибка создания заявки");
    return res.json();
  },

  async updateState(id, state) {
    const res = await fetch(`${BASE_URL}/tickets/${id}/state`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    if (!res.ok) throw new Error("Ошибка смены статуса");
    return res.json();
  },

  async delete(id) {
    const res = await fetch(`${BASE_URL}/tickets/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Ошибка удаления");
  },
};