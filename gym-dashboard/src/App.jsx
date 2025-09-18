import React, { useState, useEffect } from "react";

const MEMBERS_KEY = "gym_members_v1";

const membershipOptions = ["Gym", "Muay Thai", "Muay Thai Kids", "Zumba"];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function parseDateInput(s) {
  const d = new Date(s + "T00:00:00");
  return isNaN(d) ? null : d;
}

export default function App() {
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    type: "Gym",
    amount: "",
    start: "",
    end: "",
  });

  // Load members from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(MEMBERS_KEY);
    if (raw) setMembers(JSON.parse(raw));
  }, []);

  // Persist members
  useEffect(() => {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  }, [members]);

  // Helpers
  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", phone: "", type: "Gym", amount: "", start: "", end: "" });
  };

  const statusOf = (member) => {
    const today = new Date();
    const end = new Date(member.end + "T23:59:59");
    return end >= today ? "Active" : "Expired";
  };

  const daysLeft = (member) => {
    const today = new Date();
    const end = new Date(member.end + "T23:59:59");
    return Math.ceil((end - today) / (24 * 60 * 60 * 1000));
  };

  const handleAddOrUpdate = (e) => {
    e.preventDefault();
    const startDate = parseDateInput(form.start);
    const endDate = parseDateInput(form.end);
    if (!form.name || !form.phone || !startDate || !endDate) {
      alert("Please fill name, phone, start date and end date.");
      return;
    }
    if (editing) {
      setMembers((prev) =>
        prev.map((m) => (m.id === editing.id ? { ...m, ...form } : m))
      );
    } else {
      setMembers((prev) => [{ id: uid(), ...form }, ...prev]);
    }
    resetForm();
  };

  const handleEdit = (member) => {
    setEditing(member);
    setForm({ ...member });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this member?")) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // Filtered members
  const filtered = members
    .filter((m) => {
      const q = query.trim().toLowerCase();
      if (q && !m.name.toLowerCase().includes(q) && !String(m.phone).includes(q))
        return false;
      if (filterType !== "All" && m.type !== filterType) return false;
      if (filterStatus !== "All" && statusOf(m) !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => new Date(a.end) - new Date(b.end));

  // CSV import/export
  const importCSVText = (text) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l);
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const mapIdx = {
      name: header.indexOf("name"),
      phone: header.indexOf("phone"),
      type: header.indexOf("type"),
      amount: header.indexOf("amount"),
      start: header.indexOf("start"),
      end: header.indexOf("end"),
    };
    const newOnes = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const obj = {
        id: uid(),
        name: cols[mapIdx.name]?.trim() || "",
        phone: cols[mapIdx.phone]?.trim() || "",
        type: cols[mapIdx.type]?.trim() || "Gym",
        amount: Number(cols[mapIdx.amount]?.trim() || 0),
        start: cols[mapIdx.start]?.trim() || "",
        end: cols[mapIdx.end]?.trim() || "",
      };
      if (obj.name && obj.phone) newOnes.push(obj);
    }
    if (newOnes.length) {
      setMembers((prev) => [...newOnes, ...prev]);
      alert(`Imported ${newOnes.length} members`);
    } else alert("No valid rows found in CSV");
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => importCSVText(ev.target.result);
    reader.readAsText(file);
    e.target.value = null;
  };

  const exportCSV = () => {
    const lines = ["name,phone,type,amount,start,end"];
    members.forEach((m) =>
      lines.push([m.name, m.phone, m.type, m.amount, m.start, m.end].join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "b7_members_export.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4 md:p-6 font-sans">
      {/* Header with improved navbar */}
      <header className="mb-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 p-4 bg-gray-800 rounded-xl border border-yellow-500/20">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3 font-bold text-xl text-black">B7</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">B7 Gym Dashboard</h1>
              <p className="text-gray-400 text-sm">Manage members, track subscriptions</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2 md:gap-4">
            <button className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
              Dashboard
            </button>
            <button className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
              Reports
            </button>
            <button className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
              Settings
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {/* Left: Add/Edit Form */}
        <section className="md:col-span-1 bg-gray-800 p-5 rounded-xl border border-yellow-500/20 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-yellow-400 border-b border-yellow-500/30 pb-2">
            {editing ? "Edit Member" : "Add Member"}
          </h2>
          <form onSubmit={handleAddOrUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
              <input
                placeholder="Enter phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Membership Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                {membershipOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Amount Paid ($)</label>
              <input
                type="number"
                placeholder="Enter amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                  className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                  className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button 
                type="submit" 
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2.5 rounded-lg font-medium flex-1 transition-colors"
              >
                {editing ? "Save Changes" : "Add Member"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="border border-gray-600 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          </form>
          
          <div className="mt-6 pt-4 border-t border-gray-700">
            <h3 className="text-md font-medium text-yellow-400 mb-3">CSV Operations</h3>
            <div className="text-xs text-gray-400 mb-2">Import CSV (header: name,phone,type,amount,start,end)</div>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileImport} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  id="csvFileInput"
                />
                <label 
                  htmlFor="csvFileInput" 
                  className="block w-full bg-gray-700 border border-gray-600 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg cursor-pointer text-center text-sm transition-colors"
                >
                  Choose CSV File
                </label>
              </div>
              <button 
                type="button" 
                onClick={exportCSV} 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>
        </section>

        {/* Right: Filters + Members */}
        <section className="md:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-gray-800 p-4 rounded-xl border border-yellow-500/20 shadow-lg">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-300 mb-1">Search by name or phone</label>
                <input
                  placeholder="Search members..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <div className="min-w-[120px]">
                <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option>All</option>
                  {membershipOptions.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[120px]">
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option>All</option>
                  <option>Active</option>
                  <option>Expired</option>
                </select>
              </div>
              <div className="text-sm bg-gray-900 text-yellow-400 px-3 py-2 rounded-lg border border-yellow-500/30 min-w-[120px] text-center">
                Total: <strong className="text-white">{members.length}</strong>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="grid gap-3">
            {filtered.length === 0 ? (
              <div className="bg-gray-800 p-5 rounded-xl border border-yellow-500/20 text-center text-gray-400">
                <svg className="w-10 h-10 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                No members found. Add your first member or adjust your search filters.
              </div>
            ) : (
              filtered.map((m) => (
                <div
                  key={m.id}
                  className="bg-gray-800 p-4 rounded-xl border border-yellow-500/20 flex flex-col sm:flex-row justify-between items-start gap-3 transition-all hover:border-yellow-500/40"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-white">{m.name}</div>
                      <span className="text-xs text-gray-400">({m.phone})</span>
                    </div>
                    <div className="text-xs text-gray-300 mb-1">
                      <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-md mr-1.5">{m.type}</span>
                      <span>Paid: ${m.amount}</span>
                    </div>
                    <div className="text-xs text-gray-400 flex flex-wrap gap-1">
                      <span>Start: {m.start}</span>
                      <span>•</span>
                      <span>End: {m.end}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-white text-xs font-medium ${
                      statusOf(m) === "Active" ? "bg-green-600" : "bg-red-600"
                    }`}>
                      {statusOf(m)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {statusOf(m) === "Active"
                        ? `${daysLeft(m)} day(s) left`
                        : `Expired ${Math.abs(daysLeft(m))} day(s) ago`}
                    </span>
                    <div className="flex gap-1.5 mt-0.5">
                      <button 
                        onClick={() => handleEdit(m)} 
                        className="px-2 py-0.5 border border-gray-600 text-gray-300 rounded text-xs hover:bg-gray-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id)} 
                        className="px-2 py-0.5 border border-red-800 text-red-400 rounded text-xs hover:bg-red-900/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center max-w-6xl mx-auto">
        <div className="bg-gray-800 p-3 rounded-xl border border-yellow-500/20 text-yellow-400 text-sm">
          💡 <strong>Tip:</strong> Use the import/export CSV feature to move data between Excel and this app.
        </div>
      </footer>
    </div>
  );
}