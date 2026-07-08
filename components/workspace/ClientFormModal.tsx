"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import type { Client } from "../../lib/types";

export default function ClientFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial: Client | null;
  onSave: (client: Omit<Client, "id" | "createdAt"> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: initial?.id,
      name: name.trim(),
      email: email.trim(),
      address: address.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    });
  }

  return (
    <Modal title={initial ? "Edit client" : "Add client"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-granite">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-granite">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-granite">
            Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-granite">
            Phone
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-granite">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-granite hover:bg-black/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-night-bordeaux px-4 py-2 text-sm font-semibold text-jasmine hover:bg-[#3a0416]"
          >
            Save client
          </button>
        </div>
      </form>
    </Modal>
  );
}
