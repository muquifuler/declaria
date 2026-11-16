import { useState, type ChangeEvent, type FormEvent } from 'react';
import './ContactForm.css';

type Field = 'name' | 'email' | 'message' | 'website';
type SendState = { status: 'idle' | 'sending' | 'sent' | 'error'; error: string };

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '', website: '' });
  const [state, setState] = useState<SendState>({ status: 'idle', error: '' });
  const set = (key: Field) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState({ status: 'sending', error: '' });
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setState({ status: 'sent', error: '' });
      setForm({ name: '', email: '', message: '', website: '' });
    } catch (err) {
      setState({ status: 'error', error: (err as Error).message });
    }
  };

  if (state.status === 'sent') return <p className="contact__ok">¡Gracias! Te responderemos pronto.</p>;

  return (
    <form className="contact" onSubmit={submit}>
      <input className="contact__trap" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} aria-hidden="true" />
      <label>Nombre<input required value={form.name} onChange={set('name')} /></label>
      <label>Email<input required type="email" value={form.email} onChange={set('email')} /></label>
      <label>Mensaje<textarea required rows={5} value={form.message} onChange={set('message')} /></label>
      {state.error && <p className="contact__error">{state.error}</p>}
      <button disabled={state.status === 'sending'}>{state.status === 'sending' ? 'Enviando…' : 'Enviar'}</button>
    </form>
  );
}
