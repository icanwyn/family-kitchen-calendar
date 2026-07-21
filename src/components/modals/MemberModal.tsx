"use client";

import { useEffect, useState } from "react";
import { useFamilyStore } from "@/context/FamilyStore";
import { Modal, Field, inputClass, selectClass } from "@/components/ui/Modal";
import type { FamilyMember, MemberRole } from "@/lib/types";
import { MEMBER_COLORS } from "@/lib/types";
import { PROFILE_AVATARS } from "@/lib/avatars";

interface MemberModalProps {
  open: boolean;
  onClose: () => void;
  member?: FamilyMember | null;
}

export function MemberModal({ open, onClose, member }: MemberModalProps) {
  const { addMember, updateMember, removeMember, members } = useFamilyStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState<string>(MEMBER_COLORS[0]);
  const [avatarImage, setAvatarImage] = useState<string>(PROFILE_AVATARS[0].src);
  const [role, setRole] = useState<MemberRole>("child");

  useEffect(() => {
    if (!open) return;
    if (member) {
      setName(member.name);
      setEmail(member.email ?? "");
      setColor(member.color);
      setAvatarImage(
        member.avatarImage ||
          PROFILE_AVATARS[members.findIndex((m) => m.id === member.id) % PROFILE_AVATARS.length]?.src ||
          PROFILE_AVATARS[0].src
      );
      setRole(member.role);
    } else {
      const used = new Set(members.map((m) => m.color));
      const nextColor =
        MEMBER_COLORS.find((c) => !used.has(c)) ?? MEMBER_COLORS[0];
      const nextAvatar =
        PROFILE_AVATARS[members.length % PROFILE_AVATARS.length].src;
      setName("");
      setEmail("");
      setColor(nextColor);
      setAvatarImage(nextAvatar);
      setRole(members.length === 0 ? "parent" : "child");
    }
  }, [open, member, members]);

  const handleSave = () => {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      email: email.trim() || undefined,
      color,
      avatarEmoji: "👤",
      avatarImage,
      role,
    };
    if (member) {
      updateMember(member.id, payload);
    } else {
      addMember(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member ? `Edit ${member.name}` : "Add family member"}
    >
      <div className="mb-5 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
        <span className="relative h-16 w-16 overflow-hidden rounded-full shadow-sm ring-2 ring-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarImage}
            alt=""
            className="h-full w-full object-cover"
          />
        </span>
        <div>
          <p className="text-lg font-bold text-slate-900">
            {name.trim() || "Name"}
          </p>
          <p className="text-sm capitalize text-slate-500">
            {role}
            {email.trim() ? ` · ${email.trim()}` : ""}
          </p>
        </div>
      </div>

      <Field label="Name">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Aiden"
          autoFocus
        />
      </Field>

      <Field label="Email (optional)">
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Used when connecting Google / Outlook"
        />
      </Field>

      <Field label="Role">
        <select
          className={selectClass}
          value={role}
          onChange={(e) => setRole(e.target.value as MemberRole)}
        >
          <option value="parent">Parent</option>
          <option value="child">Child</option>
          <option value="other">Other</option>
        </select>
      </Field>

      <Field label="Profile avatar">
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {PROFILE_AVATARS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAvatarImage(a.src)}
                className={`relative aspect-square overflow-hidden rounded-2xl transition ${
                  avatarImage === a.src
                    ? "ring-2 ring-sky-600 ring-offset-2"
                    : "ring-1 ring-slate-300 hover:ring-sky-400"
                }`}
                title={a.label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.src}
                  alt={a.label}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
        <span className="mt-1.5 block text-xs font-medium text-slate-600">
          {PROFILE_AVATARS.length} styles — scroll for more
        </span>
      </Field>

      <Field label="Calendar color">
        <div className="flex flex-wrap gap-2">
          {MEMBER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-10 w-10 rounded-full transition ${
                color === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""
              }`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </Field>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-700 disabled:opacity-40"
        >
          {member ? "Save changes" : "Add member"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
        >
          Cancel
        </button>
        {member && members.length > 1 && (
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  `Remove ${member.name} from the family? Their events, chores, and fitness will also be removed.`
                )
              ) {
                removeMember(member.id);
                onClose();
              }
            }}
            className="ml-auto rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            Remove member
          </button>
        )}
      </div>
    </Modal>
  );
}
