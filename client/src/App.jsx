import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import debounce from "lodash.debounce";
import "./App.css";

const API = "http://localhost:5000/api/notes";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [active, setActive] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [q, setQ] = useState("");

  // fetch notes
  const fetchNotes = async (params = {}) => {
    const resp = await axios.get(API, { params });
    setNotes(resp.data);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // debounced search
  const runSearch = useMemo(
    () => debounce((query) => {
      fetchNotes({ q: query || undefined, sort: "updatedAt:desc" });
    }, 400),
    []
  );

  useEffect(() => {
    runSearch(q);
  }, [q, runSearch]);

  // create new note
  const newNote = async () => {
    const resp = await axios.post(API, { title: "Untitled", content: "", tags: [] });
    const freshly = resp.data;
    setNotes(prev => [freshly, ...prev]);
    pick(freshly);
  };

  const pick = (n) => {
    setActive(n);
    setTitle(n.title || "");
    setContent(n.content || "");
    setTags((n.tags || []).join(", "));
  };

  // autosave
  const debouncedSave = useMemo(
    () => debounce(async (payload) => {
      if (!active?._id) return;
      const resp = await axios.put(`${API}/${active._id}`, payload);
      setNotes(prev => {
        const updated = prev.map(n => n._id === resp.data._id ? resp.data : n);
        updated.sort((a,b)=> new Date(b.updatedAt)-new Date(a.updatedAt));
        return updated;
      });
    }, 800),
    [active]
  );

  useEffect(() => {
    if (!active) return;
    const payload = { 
      title, 
      content, 
      tags: tags.split(',').map(t=>t.trim()).filter(Boolean) 
    };
    debouncedSave(payload);
    return () => debouncedSave.flush();
  }, [title, content, tags, active, debouncedSave]);

  const togglePin = async (n) => {
    const resp = await axios.patch(`${API}/${n._id}/pin`, { pinned: !n.pinned });
    setNotes(prev => prev.map(x => x._id === n._id ? resp.data : x));
  };

  const toggleArchive = async (n) => {
    const resp = await axios.patch(`${API}/${n._id}/archive`, { archived: !n.archived });
    setNotes(prev => prev.map(x => x._id === n._id ? resp.data : x));
  };

  const remove = async (n) => {
    await axios.delete(`${API}/${n._id}`);
    if (active?._id === n._id) setActive(null);
    setNotes(prev => prev.filter(x => x._id !== n._id));
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Notes</h2>
        <button className="new-btn" onClick={newNote}>+ New</button>
        <input
          className="search"
          placeholder="Search..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />

        <div className="note-list">
          {notes.map(n => (
            <div 
              key={n._id}
              onClick={()=>pick(n)}
              className={`note-item ${active?._id===n._id ? "active" : ""}`}
            >
              <div className="note-header">
                {n.pinned && <span title="Pinned">📌</span>}
                {n.archived && <span title="Archived">🗄️</span>}
                <strong>{n.title || "Untitled"}</strong>
              </div>
              <div className="note-tags">{(n.tags || []).join(", ")}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Editor */}
      <main className="editor">
        {active ? (
          <>
            <input
              className="title-input"
              value={title}
              onChange={e=>setTitle(e.target.value)}
              placeholder="Title"
            />
            <input
              className="tags-input"
              value={tags}
              onChange={e=>setTags(e.target.value)}
              placeholder="Tags (comma separated)"
            />
            <div className="actions">
              <button className="pin-btn" onClick={()=>togglePin(active)}>
                {active.pinned ? "📌 Unpin" : "📌 Pin"}
              </button>
              <button className="archive-btn" onClick={()=>toggleArchive(active)}>
                {active.archived ? "📦 Unarchive" : "📦 Archive"}
              </button>
              <button className="delete-btn" onClick={()=>remove(active)}>
                🗑️ Delete
              </button>
            </div>
            <ReactQuill value={content} onChange={setContent} theme="snow" />
          </>
        ) : (
          <div className="placeholder">Select or create a note</div>
        )}
      </main>
    </div>
  );
}
