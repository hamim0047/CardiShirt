import { useEffect, useState } from "react";
import {
  getEmergencyContacts,
  createEmergencyContact,
  deleteEmergencyContact,
} from "../services/emergencyContactService";

export default function FamilyPage() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    relation: "",
    phone: "",
    email: "",
    priority: 1,
  });

  const loadContacts = async () => {
    try {
      const res = await getEmergencyContacts();
      setContacts(res.data.contacts || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEmergencyContact(form);
      setForm({
        name: "",
        relation: "",
        phone: "",
        email: "",
        priority: 1,
      });
      loadContacts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEmergencyContact(id);
      loadContacts();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-[#0d1230] p-6">
        <h1 className="text-2xl font-semibold text-white">Family Contacts</h1>
        <p className="mt-2 text-slate-400">
          Add family members who should receive emergency SMS alerts.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <input
            className="rounded-2xl bg-[#070b1d] px-4 py-3 text-white outline-none"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="rounded-2xl bg-[#070b1d] px-4 py-3 text-white outline-none"
            placeholder="Relation"
            value={form.relation}
            onChange={(e) => setForm({ ...form, relation: e.target.value })}
          />
          <input
            className="rounded-2xl bg-[#070b1d] px-4 py-3 text-white outline-none"
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="rounded-2xl bg-[#070b1d] px-4 py-3 text-white outline-none"
            placeholder="Email (optional)"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="number"
            className="rounded-2xl bg-[#070b1d] px-4 py-3 text-white outline-none"
            placeholder="Priority"
            value={form.priority}
            onChange={(e) =>
              setForm({ ...form, priority: Number(e.target.value) || 1 })
            }
          />
          <input
            type="text"
            placeholder="Telegram Chat ID"
            value={form.telegramChatId}
            onChange={(e) =>
              setForm({ ...form, telegramChatId: e.target.value })
            }
          />

          <button
            type="submit"
            className="rounded-2xl bg-rose-500 px-4 py-3 text-white"
          >
            Add Contact
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-[#0d1230] p-6">
        <h2 className="text-xl font-semibold text-white">Saved Contacts</h2>

        <div className="mt-5 space-y-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex flex-col gap-3 rounded-2xl bg-[#070b1d] p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium text-white">{contact.name}</p>
                <p className="text-sm text-slate-400">
                  {contact.relation || "Family"} · {contact.phone}
                </p>
              </div>

              <button
                onClick={() => handleDelete(contact.id)}
                className="rounded-xl bg-red-500/10 px-4 py-2 text-red-400"
              >
                Delete
              </button>
            </div>
          ))}

          {contacts.length === 0 && (
            <p className="text-slate-500">No family contacts added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
