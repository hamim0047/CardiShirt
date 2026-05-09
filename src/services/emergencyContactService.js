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

export const getEmergencyContacts = () => API.get("/emergency-contacts");
export const createEmergencyContact = (data) =>
  API.post("/emergency-contacts", data);
export const updateEmergencyContact = (id, data) =>
  API.put(`/emergency-contacts/${id}`, data);
export const deleteEmergencyContact = (id) =>
  API.delete(`/emergency-contacts/${id}`);