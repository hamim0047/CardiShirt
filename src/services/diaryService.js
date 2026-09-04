import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("cardishirt_token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const getDiaryCalendar = (monthStr) =>
  API.get(`/diary/calendar?month=${monthStr}`);
export const getDiaryDay = (dateStr) => API.get(`/diary/day?date=${dateStr}`);
export const addJournalEntry = (entry) => API.post("/diary/journal", entry);
export const updateJournalEntry = (id, data) =>
  API.patch(`/diary/journal/${id}`, data);
