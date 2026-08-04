"use client";

import { FormEvent, useState } from "react";
import { rooms, services } from "./data";

const locations = ["Kuala Lumpur", "Kota Kinabalu", "Semporna"];
const needs = ["Accommodation", "Airport Transfer", "Private Car", "Island Transfer", "Day Trip", "Other"];

function Logo() {
  return <a className="logo" href="#top" aria-label="MY Malaysia home"><span className="logo-mark">⌂</span><span><b>MY MALAYSIA</b><small>STAY &amp; TRAVEL</small></span></a>;
}

export function HomePage() {
  const [status, setStatus] = useState("");
  const [menu, setMenu] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus("Sending…");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const requirements = new FormData(form).getAll("requirements");
    const res = await fetch("/api/inquiries", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({...data, requirements}) });
    if (res.ok) { form.reset(); setStatus("Thank you — we’ll be in touch soon."); }
    else setStatus("Something went wrong. Please try again.");
  }
  return <>
    <header id="top"><Logo/><button className="menu-btn" onClick={()=>setMenu(!menu)} aria-label="Toggle menu">{menu ? "×" : "☰"}</button><nav className={menu?"open":""}><a href="#stays">Rooms</a><a href="#services">Services</a><a href="#contact">Contact</a></nav><a className="button header-cta" href="#contact">Submit inquiry</a></header>
    <main>
      <section className="hero">
        <img src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=90" alt="Warm, bright Malaysian apartment living room" />
        <div className="hero-copy"><p className="eyebrow">Malaysia, made easy</p><h1>Stay Comfortably,<br/>Travel Easily.</h1><p>Comfortable stays and private travel services<br className="desktop"/> in Kuala Lumpur, Kota Kinabalu &amp; Semporna.</p><div className="hero-actions"><a className="button" href="#stays">Explore rooms</a><a className="button outline" href="#services">View services</a></div></div>
      </section>
      <section id="stays" className="section stays"><div className="section-heading"><p className="eyebrow">Find your place</p><h2>Our Stays</h2><p>Carefully selected homes in the best locations.</p></div>
        {locations.map((location, i)=><div className="location" key={location}><div className="location-title"><h3><span>{i===0?"⌂":i===1?"♧":"≈"}</span>{location}</h3><span>{rooms.filter(r=>r.location===location).length} stays</span></div><div className="room-grid">{rooms.filter(r=>r.location===location).map(room=><article className="room-card" key={room.id}><a className="card-image" href={`/rooms/${room.id}`}><img src={room.image} alt={room.name}/><span className="location-pill">{room.location}</span></a><div className="card-body"><h4>{room.name}</h4><div className="room-meta"><span>♙ {room.guests} Guests</span><span>▣ {room.bedrooms} Bedrooms</span><span>▰ {room.beds} Beds</span></div><a className="text-link" href={`/rooms/${room.id}`}>View room <span>↗</span></a></div></article>)}</div></div>)}
      </section>
      <section id="services" className="section services"><div className="section-heading"><p className="eyebrow">Travel with a local</p><h2>Local Services</h2><p>Make your Malaysia trip easier with our local services.</p></div><div className="service-grid">{services.map((s,i)=><article className="service-card" key={s.name}><div className="service-image"><img src={s.image} alt={s.name}/><span>{["✈","↗","≈","◎"][i]}</span></div><div><h3>{s.name}</h3><p>{s.description}</p><a href="#contact" aria-label={`Ask about ${s.name}`}>→</a></div></article>)}</div></section>
      <section id="contact" className="inquiry"><div className="inquiry-intro"><p className="eyebrow">Start planning</p><h2>Plan Your Stay &amp; Trip</h2><p>Tell us your plan and we’ll get back to you with thoughtful local recommendations.</p><div className="contact-note"><span>01</span><p><b>Share your travel plan</b><br/>Dates, group size and what you need.</p></div><div className="contact-note"><span>02</span><p><b>We’ll reply personally</b><br/>No booking engine, just real local help.</p></div></div><form onSubmit={submit}><div className="form-grid"><label>Name<input required name="name" placeholder="Your name"/></label><label>WhatsApp / WeChat<input required name="contact" placeholder="Your contact"/></label><label>Travel Date<input required name="date" type="date"/></label><label>Number of People<input required name="people" type="number" min="1" placeholder="2"/></label></div><fieldset><legend>I need <small>(select all that apply)</small></legend><div className="checks">{needs.map(n=><label key={n}><input type="checkbox" name="requirements" value={n}/><span>{n}</span></label>)}</div></fieldset><label>Message<textarea name="message" rows={5} placeholder="Tell us about your stay or travel plan…"/></label><button className="button submit" type="submit">Submit inquiry <span>↗</span></button><p className="form-status" aria-live="polite">{status}</p></form></section>
    </main>
    <footer><Logo/><p>Comfortable stays and private local travel services across Malaysia.</p><div><a href="#stays">Rooms</a><a href="#services">Services</a><a href="#contact">Contact</a></div><small>© 2026 MY Malaysia Stay &amp; Travel</small></footer>
  </>;
}
