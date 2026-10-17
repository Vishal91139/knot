import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext.jsx";

/* ============================================================
   KNOT — Organizer Dashboard (faculty with an organizer account)
   Same design system as the student dashboard.
   Live endpoints (when signed in): GET /users/profile, GET /events?organizerId=,
     POST /events, PATCH /events/:id, PATCH /events/:id/status, DELETE /events/:id
   Needs backend work (mocked, marked "MOCK"): GET /organizers/me, attendees +
     check-in, coordination tasks/volunteers, chat (Socket.io), announcements
   ============================================================ */

// In your Vite app, swap this for: import.meta.env.VITE_API_URL
const API = "http://localhost:8000/api/v1";
const call = async (method, path, body) => {
  const res = await fetch(`${API}${path}`, { method, credentials: "include", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.message || `Request failed (${res.status})`);
  return j.data;
};

const ago = (h) => new Date(Date.now() - h * 36e5).toISOString();
const at = (d, h) => { const t = new Date(); t.setDate(t.getDate() + d); t.setHours(h, 0, 0, 0); return t; };
const mk = (o) => ({ mode: "offline", is_paid: false, is_team_event: false, event_type: "incollege", ...o,
  start_datetime: at(o.d, o.h).toISOString(), end_datetime: new Date(at(o.d, o.h).getTime() + o.dur * 36e5).toISOString(), registration_deadline: at(o.d - 1, o.h).toISOString() });

/* ---------- MOCK DATA: replace when endpoints exist ---------- */
const ME = "Prof. Rekha N";
const MOCK_USER = { full_name: ME, email: "rekha@sapthagiri.edu", role: "faculty", college_id: "c1" };
const MOCK_ORG = { id: "o1", org_name: "CSE Department", org_type: "department", college_id: "c1", follower_count: 214 };
const MOCK_EVENTS = [
  mk({ id: "e1", title: "HackSapthagiri 24h", short_description: "Build something that ships by sunrise.", long_description: "Twenty-four hours, teams of two to four, one problem statement revealed at kickoff.", category: "hackathon", status: "live", d: 3, h: 10, dur: 26, venue_name: "Main Auditorium", max_capacity: 120, registered_count: 96, is_team_event: true, min_team_size: 2, max_team_size: 4 }),
  mk({ id: "e5", title: "Papers & Chai: ML Reading Group", short_description: "One paper, one hour, strong opinions.", long_description: "Read the paper beforehand, bring one question.", category: "academic", status: "approved", d: 5, h: 17, dur: 1, venue_name: "Seminar Hall 2", max_capacity: 40, registered_count: 12 }),
  mk({ id: "e3", title: "Intro to Rust, Online", short_description: "Ownership and borrowing in two hours.", long_description: "A hands-on session for people who know one other language.", category: "workshop", status: "pending", d: 9, h: 18, dur: 2, venue_name: "Google Meet", mode: "online", max_capacity: 80, registered_count: 0 }),
  mk({ id: "e9", title: "Alumni Meet 2026", short_description: "An evening with graduates from the last decade.", long_description: "Panel, networking and dinner.", category: "other", status: "revision", rejection_reason: "Please attach the venue booking confirmation before resubmitting.", d: 20, h: 17, dur: 4, venue_name: "Convention Hall", max_capacity: 300, registered_count: 0, is_paid: true, entry_fee: 500 }),
  mk({ id: "e10", title: "Robotics Open House", short_description: "Walk through the labs and meet the teams.", long_description: "Demos from the robotics club.", category: "technical", status: "draft", d: 25, h: 10, dur: 5, venue_name: "ECE Lab Block", max_capacity: 150, registered_count: 0 }),
  mk({ id: "e8", title: "Web3 Workshop", short_description: "Wallets, contracts and what to ignore.", long_description: "A beginner session on how blockchains work.", category: "workshop", status: "completed", d: -12, h: 10, dur: 3, venue_name: "Lab 2", max_capacity: 60, registered_count: 60 }),
];
const NAMES = ["Ananya R", "Rohan M", "Divya S", "Karthik B", "Yashas V", "Meghana P", "Arjun K", "Sneha L", "Pranav H", "Isha T", "Nikhil G", "Varun D", "Aditi C", "Sanjay J", "Lakshmi N", "Harsha W", "Tanvi O", "Rahul E"];
const genAttendees = (e) => Array.from({ length: Math.min(e.registered_count, 18) }, (_, i) => ({
  id: `${e.id}-${i}`, name: NAMES[i % NAMES.length], roll: `1SG22CS${100 + i}`, branch: i % 3 ? "CSE" : "ISE", team: e.is_team_event ? ["Null Pointers", "Stack Overflowers", "Byte Me"][i % 3] : null,
  status: i % 9 === 8 ? "waitlisted" : "confirmed", checked_in: e.status === "completed" || i < 3, qr: `KNOT-${String(e.id).toUpperCase()}${i}` }));
const MOCK_TASKS = [
  { id: "k1", event_id: "e1", title: "Book mentor lunch", who: "Divya S", due: at(1, 12).toISOString(), col: "doing" },
  { id: "k2", event_id: "e1", title: "Print 120 participant badges", who: "Rohan M", due: at(2, 10).toISOString(), col: "todo" },
  { id: "k3", event_id: "e1", title: "Test projector and mics in the auditorium", who: "Arjun K", due: at(2, 16).toISOString(), col: "todo" },
  { id: "k4", event_id: "e1", title: "Confirm judges", who: "Prof. Rekha N", due: at(-1, 9).toISOString(), col: "todo" },
  { id: "k5", event_id: "e1", title: "Set up registration desk", who: "Sneha L", due: at(3, 8).toISOString(), col: "todo" },
  { id: "k6", event_id: "e5", title: "Share the paper PDF with registrants", who: "Meghana P", due: at(3, 18).toISOString(), col: "done" },
  { id: "k7", event_id: "e1", title: "Collect sponsor banners", who: "Nikhil G", due: at(-3, 12).toISOString(), col: "done" },
];
const MOCK_VOLS = [{ id: "v1", name: "Divya S", role: "Logistics" }, { id: "v2", name: "Rohan M", role: "Volunteer" }, { id: "v3", name: "Arjun K", role: "Tech support" }, { id: "v4", name: "Sneha L", role: "Registration desk" }, { id: "v5", name: "Meghana P", role: "Volunteer" }, { id: "v6", name: "Nikhil G", role: "Sponsorship" }];
const MOCK_CHANNELS = [
  { id: "c1", type: "announce", title: "HackSapthagiri · Announcements", sub: "Broadcast to registered students", members: 96, unread: 0, messages: [
    { id: "a1", from: ME, text: "Kickoff is at 10:00 in the Main Auditorium. Bring your college ID and a laptop charger.", at: ago(3) },
    { id: "a2", from: ME, text: "Problem statements drop at 10:30 sharp. Teams of two to four only.", at: ago(1) }] },
  { id: "c4", type: "group", title: "HackSapthagiri · Participants", sub: "96 students and organizers", members: 96, unread: 2, messages: [
    { id: "p1", from: "Ananya R", text: "Is there a size limit for teams?", at: ago(5) },
    { id: "p2", from: ME, text: "Two to four members per team.", at: ago(4) },
    { id: "p3", from: "Karthik B", text: "Do we need to bring our own laptops?", at: ago(2) },
    { id: "p4", from: "Isha T", text: "Will food be provided overnight?", at: ago(1) }] },
  { id: "c2", type: "group", title: "HackSapthagiri · Organizing team", sub: "6 volunteers", members: 6, unread: 1, messages: [
    { id: "o1", from: "Divya S", text: "Registration desk is set for 9:00. Who has the extension boards?", at: ago(5) },
    { id: "o2", from: "Rohan M", text: "I'll bring four.", at: ago(4) },
    { id: "o3", from: ME, text: "Thanks. Please confirm the mentor schedule by tonight.", at: ago(2) },
    { id: "o4", from: "Arjun K", text: "Mentor schedule sent to the group doc.", at: ago(1) }] },
  { id: "c3", type: "dm", title: "Admin desk · College admin", sub: "Direct message", members: 2, unread: 1, messages: [
    { id: "d1", from: "College Admin", text: "Alumni Meet needs the venue booking confirmation before approval.", at: ago(26) }] },
];
const MOCK_RECENT = [["Isha T", "HackSapthagiri 24h", "12 min ago"], ["Pranav H", "HackSapthagiri 24h", "40 min ago"], ["Aditi C", "Papers & Chai", "2 hours ago"], ["Varun D", "HackSapthagiri 24h", "3 hours ago"]];
/* ------------------------------------------------------------- */

const CATS = ["hackathon", "technical", "cultural", "sports", "workshop", "academic", "other"];
const CAT = {
  hackathon: ["#b8321c"], technical: ["#1f6f68"], cultural: ["#7d3a86"], sports: ["#2f7a3a"], workshop: ["#b97a0c"], academic: ["#2c4a7c"], other: ["#5b4a3b"],
};
const GROUPS = { all: null, draft: ["draft"], review: ["pending", "reviewing", "revision"], live: ["approved", "live"], past: ["completed", "cancelled", "rejected"] };
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const initials = (n = "") => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const toLocalInput = (iso) => { const d = new Date(iso), p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
const download = (name, text, type) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); };

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .32 0 0 0 0 .18 0 0 0 0 .06 0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;
const PAPER = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .4 0 0 0 0 .3 0 0 0 0 .15 0 0 0 .13 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

const css = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');
.kd{--cork:#c9985f;--paper:#fbf5e6;--ink:#2a1d12;--red:#b8321c;--teal:#1f6f68;--gold:#e3a72a;--sticky:#f6df72;
 font-family:'Space Grotesk',sans-serif;color:var(--ink);width:100%;min-height:100vh;overflow-x:hidden;
 background:${GRAIN},radial-gradient(ellipse at 50% 0,#d9ac76 0,var(--cork) 55%,#a87a47 100%);}
.kd *{box-sizing:border-box}
.kd input,.kd select,.kd textarea{color:var(--ink)!important}
.kd input::placeholder,.kd textarea::placeholder{color:#2a1d1266!important}
.kd h1,.kd h2,.kd h3{margin:0;font-weight:400}
.kd h1,.kd h2{font-family:'Anton',sans-serif;letter-spacing:.015em}
.kd .mono{font-family:'Space Mono',monospace;font-size:12px}
.kd button{font:inherit;cursor:pointer;color:inherit}
.kd button:disabled{opacity:.5;cursor:not-allowed}
.kd :focus-visible{outline:3px solid var(--teal);outline-offset:3px}
.kd ul{margin:0;padding:0;list-style:none}
.kd p{margin:0}

/* top nav + mobile tab bar */
.kd .nav{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:18px;padding:10px clamp(14px,4vw,48px);background:var(--ink);color:var(--paper);box-shadow:0 4px 0 rgba(0,0,0,.25)}
.kd .logo{font-family:'Anton';font-size:26px;display:flex;align-items:center;gap:8px;letter-spacing:.04em}
.kd .links{display:flex;gap:4px;margin-left:12px;flex:1}
.kd .lnk{background:none;border:0;color:var(--paper);padding:6px 14px;border-radius:99px;font-size:14px;white-space:nowrap}
.kd .lnk:hover{background:#fff2}
.kd .lnk[aria-current=page]{background:var(--gold);color:var(--ink);font-weight:700}
.kd .bell{position:relative;background:none;border:0;font-size:20px;padding:4px 6px}
.kd .bell b{position:absolute;top:-2px;right:-4px;background:var(--red);color:#fff;font:700 10px 'Space Mono';min-width:17px;height:17px;border-radius:9px;display:grid;place-items:center}
.kd .avatar{width:38px;height:38px;border-radius:50%;background:var(--gold);color:var(--ink);display:grid;place-items:center;font:700 14px 'Space Mono';border:2px solid var(--paper);overflow:hidden;padding:0}
.kd .avatar img{width:100%;height:100%;object-fit:cover}
.kd .tabbar{display:none}
.kd .dot{background:var(--red);color:#fff;font:700 10px 'Space Mono';border-radius:9px;padding:1px 6px;margin-left:6px}
@media(max-width:820px){
 .kd .links{display:none}.kd .nav{justify-content:space-between}
 .kd .tabbar{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;bottom:0;left:0;right:0;z-index:30;background:var(--ink);padding:6px 4px calc(6px + env(safe-area-inset-bottom));box-shadow:0 -4px 14px #0006}
 .kd .tabbar button{background:none;border:0;color:#fbf5e6aa;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;padding:4px 0}
 .kd .tabbar button span{font-size:19px}.kd .tabbar button[aria-current=page]{color:var(--gold);font-weight:700}
 .kd .wrap{padding-bottom:110px!important}
}
.kd .wrap{max-width:1240px;margin:0 auto;padding:30px clamp(14px,4vw,48px) 80px}

/* plaque headers */
.kd .plaque{position:relative;display:inline-block;max-width:100%;background:var(--ink);color:var(--paper);padding:18px 30px 20px;border-radius:3px;box-shadow:0 3px 0 #0005,0 14px 24px #0005;transform:rotate(-.6deg);margin-bottom:26px}
.kd .plaque::before,.kd .plaque::after{content:"";position:absolute;top:9px;width:9px;height:9px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff8,#0000 45%),var(--gold)}
.kd .plaque::before{left:9px}.kd .plaque::after{right:9px}
.kd .plaque h1{font-size:clamp(32px,5.4vw,62px);line-height:1}
.kd .plaque p{margin-top:8px;opacity:.82;max-width:52ch}
.kd .hero{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap}
.kd .stubs{display:flex;gap:12px;flex-wrap:wrap;padding-top:6px}
.kd .stub{position:relative;background:var(--paper) ${PAPER};padding:12px 18px 12px 24px;min-width:116px;border-radius:3px;box-shadow:0 3px 0 #0003,0 10px 16px #0003;transform:rotate(var(--r,0deg))}
.kd .stub::before{content:"";position:absolute;left:-7px;top:50%;width:14px;height:14px;margin-top:-7px;border-radius:50%;background:#b0824f;box-shadow:inset 1px 2px 3px #0005}
.kd .stub b{font:400 38px/1 'Anton';display:block}.kd .stub span{font-size:13px;opacity:.8}

/* section label */
.kd .sec-title{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:6px 0 20px}
.kd .sec-title h2{background:var(--paper) ${PAPER};padding:4px 18px 5px;font-size:28px;box-shadow:0 2px 0 #0003,0 8px 12px #0003;transform:rotate(-.8deg)}
.kd .linkbtn{background:var(--ink);color:var(--paper);border:0;padding:6px 14px;border-radius:99px;font-size:13px;font-weight:700}

/* ticket */
.kd .tix-wrap{filter:drop-shadow(0 12px 14px #0005);margin-bottom:36px;transform:rotate(-.5deg)}
.kd .tix{--stub:210px;display:grid;grid-template-columns:1fr var(--stub);background:var(--paper) ${PAPER};
 -webkit-mask:radial-gradient(circle 12px at calc(100% - var(--stub)) 0,#0000 97%,#000) top/100% 51% no-repeat,radial-gradient(circle 12px at calc(100% - var(--stub)) 100%,#0000 97%,#000) bottom/100% 51% no-repeat;
 mask:radial-gradient(circle 12px at calc(100% - var(--stub)) 0,#0000 97%,#000) top/100% 51% no-repeat,radial-gradient(circle 12px at calc(100% - var(--stub)) 100%,#0000 97%,#000) bottom/100% 51% no-repeat}
.kd .tix-main{padding:24px 28px;border-left:14px solid var(--red)}
.kd .tag{display:inline-block;background:var(--ink);color:var(--paper);padding:3px 10px;border-radius:2px;margin-bottom:10px}
.kd .tix-main h2{font-size:clamp(30px,4.4vw,52px);line-height:1}
.kd .tix-meta{display:flex;gap:26px;flex-wrap:wrap;margin-top:16px}
.kd .tix-meta div{font-size:14px}.kd .tix-meta b{display:block;font:400 22px 'Anton'}
.kd .count{display:flex;gap:8px;margin-top:18px}
.kd .count div{background:var(--ink);color:var(--paper);padding:6px 12px;border-radius:3px;text-align:center;min-width:62px}
.kd .count b{font:400 26px/1 'Anton';display:block}.kd .count span{font:700 10px 'Space Mono';opacity:.75}
.kd .tix-stub{border-left:2px dashed #2a1d1244;padding:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#0000000a}
.kd .qr{width:104px;height:104px;border:6px solid #fff;background:repeating-conic-gradient(var(--ink) 0 25%,#fff 0 50%) 0 0/20px 20px;outline:1px solid #0002;flex:none}
.kd .bars{width:100%;height:30px;background:repeating-linear-gradient(90deg,var(--ink) 0 2px,#0000 2px 4px,var(--ink) 4px 5px,#0000 5px 9px,var(--ink) 9px 12px,#0000 12px 14px)}
@media(max-width:700px){.kd .tix{--stub:0px;grid-template-columns:1fr;-webkit-mask:none;mask:none}.kd .tix-stub{border-left:0;border-top:2px dashed #2a1d1244;flex-direction:row}}
.kd .empty{background:#fbf5e6dd;border:3px dashed var(--ink);padding:26px;text-align:center;border-radius:4px;margin-bottom:30px}
.kd .empty h2{font-size:30px;margin-bottom:6px}.kd .empty .btn{margin-top:12px}

/* layout */
.kd .home-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:34px;align-items:start}
@media(max-width:1000px){.kd .home-grid{grid-template-columns:1fr}}
.kd aside.side{display:flex;flex-direction:column;gap:30px}
.kd .tools{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center}
.kd .search{flex:1;min-width:200px;padding:10px 14px;border:2px solid var(--ink);background:#fffdf6;border-radius:3px;font:inherit}
.kd select{padding:9px 12px;border:2px solid var(--ink);background:#fffdf6;border-radius:3px;font:inherit}
.kd .chips{display:flex;gap:6px;flex-wrap:wrap}
.kd .chip{border:2px solid var(--ink);background:#fbf5e6cc;padding:4px 12px;border-radius:99px;font-size:13px;text-transform:capitalize}
.kd .chip[aria-pressed=true]{background:var(--ink);color:var(--paper)}
.kd .found{display:inline-block;background:var(--ink);color:var(--paper);padding:3px 12px;border-radius:2px;margin:0 0 20px}

/* flyers */
.kd .flyers{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:34px 24px;margin-bottom:40px}
.kd .fly{position:relative;background:var(--paper) ${PAPER};transform:rotate(var(--r));box-shadow:0 2px 0 #0003,0 14px 20px #0004;display:flex;flex-direction:column}
.kd .fly:hover{transform:rotate(0) translateY(-4px);z-index:2}
.kd .pin{position:absolute;top:-9px;left:50%;margin-left:-9px;width:18px;height:18px;border-radius:50%;z-index:3;background:radial-gradient(circle at 35% 30%,#fff9,#0000 35%),var(--pin,var(--red));box-shadow:0 5px 5px #0005}
.kd .fly-head{height:104px;padding:14px 14px 10px;color:#fff;display:flex;justify-content:space-between;align-items:flex-end;position:relative}
.kd .fly-date{font:400 46px/.9 'Anton'}
.kd .fly-date small{display:block;font:700 12px 'Space Mono';letter-spacing:.06em}
.kd .fly-cat{font:700 11px 'Space Mono';background:#0004;padding:3px 8px;border-radius:2px;text-transform:capitalize}
.kd .heart{position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:50%;border:0;background:#fbf5e6;font-size:17px;box-shadow:0 2px 4px #0004;display:grid;place-items:center;color:var(--red)}
.kd .fly-body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:6px;flex:1}
.kd .tlink{background:none;border:0;padding:0;text-align:left;font-size:19px;font-weight:700;line-height:1.2}
.kd .tlink:hover{text-decoration:underline}
.kd .fly-body p{font-size:13.5px;opacity:.82}
.kd .by{font-size:12.5px;opacity:.7}
.kd .urgent{font:700 11px 'Space Mono';color:var(--red)}
.kd .seats{margin-top:auto;padding-top:10px}
.kd .seats .mono{display:flex;justify-content:space-between;margin-bottom:5px}
.kd .bar{height:7px;background:#2a1d1222;border-radius:4px;overflow:hidden}
.kd .bar i{display:block;height:100%;background:var(--teal)}
.kd .bar i.hot{background:var(--gold)}.kd .bar i.full{background:var(--red)}
.kd .foot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px}
.kd .foot .r{display:flex;gap:6px;align-items:center}
.kd .price{font:400 22px 'Anton'}
.kd .btn{border:2px solid var(--ink);background:var(--gold);padding:7px 14px;border-radius:3px;font-weight:700;font-size:14px;box-shadow:2px 2px 0 var(--ink)}
.kd .btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:none}
.kd .btn.ghost{background:transparent;box-shadow:none}
.kd .btn.sm{padding:4px 10px;font-size:13px}
.kd .btn.red{background:var(--red);color:#fff}
.kd .stamp{position:absolute;right:10px;top:70px;z-index:3;border:3px solid;padding:2px 10px;font:700 13px 'Space Mono';text-transform:uppercase;transform:rotate(-8deg);border-radius:4px;background:#fbf5e6ee;letter-spacing:.08em}
.kd .stamp.confirmed,.kd .stamp.attended{color:var(--teal)}.kd .stamp.waitlisted{color:var(--red)}
.kd .none{grid-column:1/-1;background:#fbf5e6dd;padding:22px;border-radius:3px;text-align:center}

/* registrations */
.kd .mini{display:flex;flex-wrap:wrap;align-items:center;gap:12px 14px;background:var(--paper) ${PAPER};padding:14px 18px;margin-bottom:14px;border-left:10px solid var(--c);box-shadow:0 2px 0 #0003,0 8px 12px #0003;border-radius:2px}
.kd .mini .grow{flex:1;min-width:200px}.kd .mini b{display:block;font-size:16px}
.kd .mini .acts{display:flex;gap:8px;flex-wrap:wrap}
.kd .pill{font:700 11px 'Space Mono';border:2px solid;padding:2px 8px;border-radius:3px;text-transform:uppercase;white-space:nowrap}
.kd .pill.confirmed,.kd .pill.attended{color:var(--teal)}.kd .pill.waitlisted{color:var(--red)}
.kd .qrrow{display:flex;gap:18px;align-items:center;padding:14px 0 4px;border-top:2px dashed #2a1d1233;width:100%}
.kd .stars{display:flex;gap:2px}.kd .stars button{background:none;border:0;font-size:22px;padding:0 1px;color:#2a1d1244}.kd .stars button.on{color:var(--gold)}

/* cards, sticky, rank */
.kd .card{position:relative;background:var(--paper) ${PAPER};padding:26px 20px 18px;box-shadow:0 2px 0 #0003,0 12px 18px #0004;transform:rotate(var(--r,0deg))}
.kd .card h2{font-size:26px;margin-bottom:12px}
.kd .acts{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.kd .rank{display:flex;align-items:center;gap:12px;padding:8px 6px;border-top:1px dashed #2a1d1233}
.kd .rank:first-of-type{border-top:0}
.kd .rank .n{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font:700 12px 'Space Mono';background:#2a1d1215}
.kd .rank:nth-of-type(1) .n{background:var(--gold)}.kd .rank:nth-of-type(2) .n{background:#cfd3d6}.kd .rank:nth-of-type(3) .n{background:#d49a6a}
.kd .rank span:nth-child(2){flex:1}
.kd .rank.me{background:linear-gradient(transparent 20%,#e3a72a88 20% 90%,transparent 90%);font-weight:700}
.kd .alert{background:var(--red);color:#fff;padding:16px 18px;margin-bottom:26px;border-radius:3px;box-shadow:0 8px 14px #0004}
.kd .alert button{background:none;border:0;color:#fff;text-decoration:underline;font-weight:700}

/* calendar */
.kd .cal{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:12.5px}
.kd .cal .h{font:700 10px 'Space Mono';opacity:.6;padding:2px 0}
.kd .cal .d{position:relative;aspect-ratio:1;display:grid;place-items:center;border-radius:50%}
.kd .cal .d.today{outline:2px solid var(--ink)}
.kd .cal .d i{position:absolute;bottom:3px;width:5px;height:5px;border-radius:50%;background:var(--teal)}
.kd .cal .d i.mine{background:var(--red);width:7px;height:7px}
.kd .legend{display:flex;gap:14px;margin-top:10px;font-size:12px}
.kd .legend span::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;background:var(--teal)}
.kd .legend span.m::before{background:var(--red)}

/* teams, profile */
.kd .teams{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:30px}
.kd .member{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px dashed #2a1d1233;font-size:14px}
.kd .member .av{width:30px;height:30px;border-radius:50%;background:var(--gold);display:grid;place-items:center;font:700 11px 'Space Mono'}
.kd .member span:nth-child(2){flex:1}
.kd .pgrid{display:grid;grid-template-columns:300px minmax(0,1fr);gap:34px;align-items:start}
@media(max-width:860px){.kd .pgrid{grid-template-columns:1fr}}
.kd .idc{position:relative;background:var(--paper) ${PAPER};padding:44px 22px 22px;text-align:center;box-shadow:0 2px 0 #0003,0 16px 24px #0005;transform:rotate(-1.2deg)}
.kd .idc::before{content:"";position:absolute;top:14px;left:50%;width:64px;height:12px;margin-left:-32px;border-radius:6px;background:#2a1d12;box-shadow:inset 0 2px 4px #000a}
.kd .idc .big{width:112px;height:112px;margin:0 auto 12px;border-radius:50%;background:var(--gold);display:grid;place-items:center;font:400 44px 'Anton';border:4px solid var(--ink);overflow:hidden}
.kd .idc .big img{width:100%;height:100%;object-fit:cover}
.kd .idc h2{font-size:28px}
.kd .vstamp{display:inline-block;margin-top:12px;border:3px solid;padding:2px 12px;font:700 13px 'Space Mono';text-transform:uppercase;transform:rotate(-4deg);letter-spacing:.08em}
.kd .vstamp.ok{color:var(--teal)}.kd .vstamp.no{color:var(--red)}
.kd .lvl{margin-top:16px;text-align:left}.kd .lvl .mono{display:flex;justify-content:space-between;margin-bottom:5px}
.kd .form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:560px){.kd .form{grid-template-columns:1fr}}
.kd .field{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:500}
.kd .field.wide{grid-column:1/-1}
.kd .field input,.kd .field select{padding:10px 12px;border:2px solid var(--ink);background:#fffdf6;border-radius:3px;font:inherit;font-size:15px}
.kd .field input:disabled{opacity:.6}
.kd .badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:14px}
.kd .badge{text-align:center;font-size:12.5px}
.kd .badge div{width:64px;height:64px;margin:0 auto 6px;border-radius:50%;display:grid;place-items:center;font-size:28px;background:var(--gold);border:3px solid var(--ink);box-shadow:0 4px 0 #0003}
.kd .badge.lock{opacity:.45}.kd .badge.lock div{background:#2a1d1222;filter:grayscale(1)}

/* modals */
.kd .scrim{position:fixed;inset:0;background:#1a0f07b0;z-index:40;display:flex;justify-content:center;align-items:flex-start;padding:70px 14px 24px;overflow:auto}
.kd .modal{position:relative;width:min(var(--w,520px),100%);background:var(--paper) ${PAPER};box-shadow:0 20px 50px #000a;border-radius:3px;overflow:hidden}
.kd .modal-b{padding:22px}
.kd .modal-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.kd .modal-h h2{font-size:30px}
.kd .x{background:#fbf5e6;border:2px solid var(--ink);border-radius:50%;width:34px;height:34px;font-size:15px;flex:none}
.kd .nrow{display:flex;gap:12px;width:100%;text-align:left;background:none;border:0;border-top:1px dashed #2a1d1244;padding:14px 6px;align-items:flex-start}
.kd .nrow em{font-style:normal;font-size:20px}
.kd .nrow.unread{background:#f6df7255}
.kd .nrow .mono{display:block;opacity:.65;margin-top:3px}
.kd .nrow i{flex:none;width:9px;height:9px;border-radius:50%;margin:8px 0 0 auto;background:var(--red)}
.kd .dh{padding:26px 24px 18px;color:#fff;position:relative}
.kd .dh h2{font-size:clamp(28px,4.4vw,44px);line-height:1.02;max-width:20ch}
.kd .dh .x{position:absolute;top:14px;right:14px}
.kd .dgrid{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:24px;padding:22px 24px}
@media(max-width:720px){.kd .dgrid{grid-template-columns:1fr}}
.kd .facts{background:#2a1d1210;padding:14px 16px;border-radius:3px;display:flex;flex-direction:column;gap:10px;font-size:13.5px;align-self:start}
.kd .facts b{display:block;font:700 10px 'Space Mono';opacity:.6;letter-spacing:.06em;text-transform:uppercase}
.kd .tl{display:flex;gap:14px;padding:10px 0;border-top:1px dashed #2a1d1233}
.kd .tl .mono{flex:none;width:96px}
.kd .warn{background:#f6df72;padding:12px 14px;border-radius:3px;margin:12px 0;font-size:14px;border:2px solid var(--ink)}
.kd .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--paper);padding:12px 20px;border-radius:99px;z-index:60;box-shadow:0 10px 24px #0006;font-size:14px;max-width:92vw;text-align:center}
@media(max-width:820px){.kd .toast{bottom:84px}}
.kd .sk{background:#fbf5e6aa;height:300px;border-radius:3px}
@media(prefers-reduced-motion:no-preference){
 .kd .fly{transition:transform .18s}.kd .toast{animation:up .25s}.kd .page{animation:fade .25s}
 .kd .sk{animation:pulse 1.2s infinite alternate}
 @keyframes up{from{opacity:0;transform:translate(-50%,12px)}}@keyframes fade{from{opacity:0;transform:translateY(6px)}}@keyframes pulse{to{opacity:.5}}}
`;

/* ---------- shared chat (same component used in student and organizer dashboards) ---------- */
// MOCK: replace with Socket.io. Join room `channel:<id>`; emit "message:send"; listen for "message:new".
const CHAT_CSS = `
.kd .chat{display:grid;grid-template-columns:330px minmax(0,1fr);height:min(700px,calc(100vh - 210px));min-height:480px;background:var(--paper) ${PAPER};box-shadow:0 2px 0 #0003,0 16px 26px #0005;border-radius:3px;overflow:hidden}
.kd .chat-list{border-right:2px dashed #2a1d1244;overflow:auto;background:#2a1d1208;display:flex;flex-direction:column}
.kd .chat-list .search{margin:12px;flex:none;min-width:0}
.kd .ch{display:flex;gap:11px;align-items:center;padding:12px 14px;border:0;border-bottom:1px dashed #2a1d1233;width:100%;text-align:left;background:none}
.kd .ch[aria-current=true]{background:#e3a72a40}.kd .ch:hover{background:#e3a72a22}
.kd .ch .ic{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--ink);font-size:18px;flex:none}
.kd .ch .tx{flex:1;min-width:0}.kd .ch .t{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kd .ch .p{font-size:12.5px;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kd .ch .u{background:var(--red);color:#fff;font:700 10px 'Space Mono';min-width:19px;height:19px;border-radius:10px;display:grid;place-items:center;padding:0 5px}
.kd .thread{display:flex;flex-direction:column;min-width:0;min-height:0}
.kd .th{padding:12px 16px;border-bottom:2px dashed #2a1d1244;display:flex;gap:12px;align-items:center}
.kd .th .t{font-weight:700}.kd .th .back{display:none;background:none;border:2px solid var(--ink);border-radius:50%;width:34px;height:34px}
.kd .msgs{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#fffdf6aa}
.kd .msg{max-width:min(520px,84%);padding:9px 13px;border-radius:13px 13px 13px 3px;background:#fff;box-shadow:0 1px 0 #0003;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
.kd .msg.me{align-self:flex-end;background:var(--gold);border-radius:13px 13px 3px 13px}
.kd .msg.ann{align-self:stretch;max-width:none;background:var(--ink);color:var(--paper);border-radius:3px;border-left:6px solid var(--red)}
.kd .msg .who{font:700 11px 'Space Mono';opacity:.65;margin-bottom:3px}
.kd .msg .at{font:10px 'Space Mono';opacity:.55;text-align:right;margin-top:4px}
.kd .composer{display:flex;gap:8px;padding:12px;border-top:2px dashed #2a1d1244;align-items:flex-end;flex-wrap:wrap}
.kd .composer textarea{flex:1;min-width:180px;resize:none;padding:10px 12px;border:2px solid var(--ink);border-radius:3px;font:inherit;background:#fffdf6;max-height:110px}
.kd .composer label{font-size:12.5px;display:flex;gap:6px;align-items:center;width:100%}
.kd .ro{padding:14px;text-align:center;font-size:13.5px;opacity:.75;border-top:2px dashed #2a1d1244}
.kd .chat-empty{margin:auto;text-align:center;opacity:.7;padding:30px}
@media(max-width:820px){.kd .chat{grid-template-columns:1fr;height:calc(100vh - 200px)}.kd .chat[data-open=true] .chat-list{display:none}.kd .chat[data-open=false] .thread{display:none}.kd .th .back{display:block}}
`;
const CH_ICON = { announce: "📣", group: "👥", dm: "💬" };

function ChatPanel({ channels, setChannels, me, canPost, setToast, broadcast = false }) {
  const [active, setActive] = useState(null), [q, setQ] = useState(""), [text, setText] = useState(""), [notify, setNotify] = useState(true);
  const end = useRef(null);
  const cur = channels.find((c) => c.id === active);
  useEffect(() => { end.current?.scrollIntoView?.({ block: "end" }); }, [active, cur?.messages.length]);
  const open = (c) => { setActive(c.id); setChannels((x) => x.map((m) => (m.id === c.id ? { ...m, unread: 0 } : m))); };
  const send = () => {
    const t = text.trim(); if (!t || !cur) return;
    const msg = { id: "m" + Date.now(), from: me, text: t, at: new Date().toISOString() };
    setChannels((x) => x.map((m) => (m.id === cur.id ? { ...m, messages: [...m.messages, msg] } : m)));
    setText("");
    if (broadcast && cur.type === "announce" && notify) setToast(`Announcement sent to ${cur.members} students`);
  };
  const list = channels.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));
  const last = (c) => c.messages[c.messages.length - 1];
  return (
    <section className="chat" data-open={!!cur} aria-label="Chat">
      <div className="chat-list">
        <input className="search" type="search" placeholder="Search chats" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search chats" />
        {list.map((c) => (
          <button key={c.id} className="ch" aria-current={c.id === active} onClick={() => open(c)}>
            <span className="ic" aria-hidden="true">{CH_ICON[c.type]}</span>
            <span className="tx"><div className="t">{c.title}</div><div className="p">{last(c) ? `${last(c).from === me ? "You" : last(c).from.split(" ")[0]}: ${last(c).text}` : "No messages yet"}</div></span>
            {c.unread > 0 && <span className="u" aria-label={`${c.unread} unread`}>{c.unread}</span>}
          </button>
        ))}
        {list.length === 0 && <p className="chat-empty">No chats match.</p>}
      </div>
      <div className="thread">
        {!cur ? <div className="chat-empty"><h2 style={{ fontSize: 28, marginBottom: 6 }}>Pick a conversation</h2><p>Announcements, team rooms and direct messages all live here.</p></div> : (
          <>
            <div className="th"><button className="back" onClick={() => setActive(null)} aria-label="Back to chats">←</button><span className="ic" style={{ fontSize: 22 }}>{CH_ICON[cur.type]}</span><div><div className="t">{cur.title}</div><div className="mono" style={{ opacity: .65 }}>{cur.sub}</div></div></div>
            <div className="msgs" aria-live="polite">
              {cur.messages.map((m) => (
                <div key={m.id} className={`msg ${cur.type === "announce" ? "ann" : m.from === me ? "me" : ""}`}>
                  {(m.from !== me || cur.type === "announce") && <div className="who">{m.from}</div>}{m.text}<div className="at">{fmtTime(m.at)}</div>
                </div>
              ))}
              <div ref={end} />
            </div>
            {canPost(cur) ? (
              <div className="composer">
                {broadcast && cur.type === "announce" && <label><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />Also send as a notification to all {cur.members} registered students</label>}
                <textarea rows={1} value={text} placeholder={cur.type === "announce" ? "Write an announcement" : "Write a message"} aria-label="Message" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
                <button className="btn" onClick={send} disabled={!text.trim()}>Send</button>
              </div>
            ) : <div className="ro">Only organizers can post in this channel.</div>}
          </>
        )}
      </div>
    </section>
  );
}

const ORG_CSS = `
.kd .tabbar{grid-template-columns:repeat(5,1fr)!important}
.kd .field textarea{padding:10px 12px;border:2px solid var(--ink);background:#fffdf6;border-radius:3px;font:inherit;font-size:15px;resize:vertical;min-height:84px}
.kd .check{display:flex;gap:8px;align-items:center;font-size:14px}
.kd .err{background:var(--red);color:#fff;padding:8px 12px;border-radius:3px;font-size:13.5px;margin-top:12px}
.kd .pill.draft,.kd .pill.cancelled{color:#6b5a4a}.kd .pill.pending,.kd .pill.reviewing{color:#b97a0c}
.kd .pill.approved,.kd .pill.live{color:var(--teal)}.kd .pill.revision,.kd .pill.rejected{color:var(--red)}.kd .pill.completed{color:#2c4a7c}
.kd .prog{height:7px;background:#2a1d1222;border-radius:4px;overflow:hidden;margin-top:6px;max-width:260px}.kd .prog i{display:block;height:100%;background:var(--teal)}
.kd .ov{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:34px;align-items:start}
@media(max-width:1000px){.kd .ov{grid-template-columns:1fr}}
.kd .attn{position:relative;background:var(--sticky);padding:18px 18px 14px;box-shadow:0 12px 14px #0004;transform:rotate(var(--r,0deg));margin-bottom:22px}
.kd .attn::after{content:"";position:absolute;top:-10px;left:50%;width:70px;height:22px;margin-left:-35px;background:#fff8;transform:rotate(-2deg);box-shadow:0 1px 3px #0003}
.kd .hbar{display:grid;grid-template-columns:130px 1fr 40px;gap:10px;align-items:center;font-size:13px;padding:5px 0}
.kd .hbar .bar{height:12px}
.kd .tblwrap{overflow:auto;background:var(--paper) ${PAPER};box-shadow:0 2px 0 #0003,0 12px 18px #0004;border-radius:3px}
.kd table{width:100%;border-collapse:collapse;font-size:14px;min-width:640px}
.kd th{font:700 11px 'Space Mono';text-transform:uppercase;letter-spacing:.06em;text-align:left;padding:12px 14px;background:var(--ink);color:var(--paper)}
.kd td{padding:10px 14px;border-bottom:1px dashed #2a1d1233}.kd tr:hover td{background:#e3a72a1c}
.kd .ci{border:2px solid var(--ink);border-radius:99px;padding:3px 12px;font:700 12px 'Space Mono';background:transparent}.kd .ci.on{background:var(--teal);border-color:var(--teal);color:#fff}
.kd .board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;margin-bottom:34px}
@media(max-width:900px){.kd .board{grid-template-columns:1fr}}
.kd .col{background:#fbf5e6cc;padding:14px;border-radius:3px;border-top:6px solid var(--c);min-height:160px;box-shadow:0 8px 14px #0003}
.kd .col h3{font:400 22px 'Anton';margin-bottom:10px;display:flex;justify-content:space-between}
.kd .task{background:var(--sticky);padding:12px 12px 10px;margin-bottom:12px;box-shadow:0 5px 8px #0003;transform:rotate(var(--r));font-size:14px}
.kd .task .mono{display:block;opacity:.7;margin-top:4px}.kd .task .mono.late{color:var(--red);opacity:1;font-weight:700}
.kd .task .acts{margin-top:8px}.kd .task button{background:none;border:2px solid var(--ink);border-radius:3px;padding:1px 9px;font-weight:700}
.kd .inline{display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:10px;align-items:end}
@media(max-width:820px){.kd .inline{grid-template-columns:1fr}}
.kd .modal .form{margin-top:12px}
`;

const Ctx = createContext(null);
const useK = () => useContext(Ctx);
const Knot = () => (<svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="#e3a72a" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true"><path d="M6 12c8-8 20-2 12 6s-14 6-8-2 16-8 14 0" /></svg>);
const statusLabel = (s) => ({ pending: "in review", reviewing: "reviewing", revision: "needs changes" }[s] || s);

function Modal({ onClose, w = 520, label, children }) {
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-label={label} style={{ "--w": w + "px" }}>{children}</div></div>;
}

/* ---------- event create / edit ---------- */
function EventForm() {
  const { form, setForm, saveEvent } = useK();
  const ev = form.event;
  const [f, setF] = useState(() => ev ? {
    title: ev.title, shortDescription: ev.short_description || "", longDescription: ev.long_description || "", category: ev.category, mode: ev.mode, eventType: ev.event_type || "incollege", venueName: ev.venue_name || "",
    start: toLocalInput(ev.start_datetime), end: toLocalInput(ev.end_datetime), deadline: toLocalInput(ev.registration_deadline), maxCapacity: ev.max_capacity, isTeam: !!ev.is_team_event, minTeam: ev.min_team_size ?? 2, maxTeam: ev.max_team_size ?? 4, isPaid: !!ev.is_paid, fee: ev.entry_fee ?? "",
  } : { title: "", shortDescription: "", longDescription: "", category: "technical", mode: "offline", eventType: "incollege", venueName: "", start: toLocalInput(at(7, 10)), end: toLocalInput(at(7, 13)), deadline: toLocalInput(at(6, 10)), maxCapacity: 100, isTeam: false, minTeam: 2, maxTeam: 4, isPaid: false, fee: "" });
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const close = () => setForm(null);
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    const s = new Date(f.start), en = new Date(f.end), d = new Date(f.deadline);
    if (!(Number(f.maxCapacity) > 0)) return setErr("Capacity must be a positive number.");
    if (en <= s) return setErr("The event must end after it starts.");
    if (d > s) return setErr("Registration must close on or before the start time.");
    if (f.isTeam && Number(f.minTeam) > Number(f.maxTeam)) return setErr("Minimum team size can't exceed the maximum.");
    if (f.isPaid && (f.fee === "" || Number(f.fee) < 0)) return setErr("Enter an entry fee for a paid event.");
    setBusy(true);
    try { await saveEvent({ title: f.title, shortDescription: f.shortDescription, longDescription: f.longDescription, category: f.category, mode: f.mode, eventType: f.eventType, venueName: f.venueName, startDatetime: s.toISOString(), endDatetime: en.toISOString(), registrationDeadline: d.toISOString(), maxCapacity: Number(f.maxCapacity), isTeamEvent: f.isTeam, ...(f.isTeam ? { minTeamSize: Number(f.minTeam), maxTeamSize: Number(f.maxTeam) } : {}), isPaid: f.isPaid, ...(f.isPaid ? { entryFee: Number(f.fee) } : {}) }, ev); close(); }
    catch (x) { setErr(x.message); }
    setBusy(false);
  };
  return (
    <Modal onClose={close} w={720} label={ev ? "Edit event" : "New event"}>
      <form className="modal-b" onSubmit={submit}>
        <div className="modal-h"><h2>{ev ? "Edit event" : "New event"}</h2><button type="button" className="x" onClick={close} aria-label="Close" autoFocus>✕</button></div>
        <div className="form">
          <label className="field wide">Title<input value={f.title} onChange={set("title")} required maxLength={200} /></label>
          <label className="field wide">Short description<input value={f.shortDescription} onChange={set("shortDescription")} required maxLength={300} /></label>
          <label className="field wide">Full description<textarea value={f.longDescription} onChange={set("longDescription")} required /></label>
          <label className="field">Category<select value={f.category} onChange={set("category")}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="field">Mode<select value={f.mode} onChange={set("mode")}><option>offline</option><option>online</option><option>hybrid</option></select></label>
          <label className="field">Open to<select value={f.eventType} onChange={set("eventType")}><option value="incollege">Our college only</option><option value="intercollege">Other colleges too</option></select></label>
          <label className="field">Venue or link<input value={f.venueName} onChange={set("venueName")} /></label>
          <label className="field">Starts<input type="datetime-local" value={f.start} onChange={set("start")} required /></label>
          <label className="field">Ends<input type="datetime-local" value={f.end} onChange={set("end")} required /></label>
          <label className="field">Registration closes<input type="datetime-local" value={f.deadline} onChange={set("deadline")} required /></label>
          <label className="field">Capacity<input type="number" min="1" value={f.maxCapacity} onChange={set("maxCapacity")} required /></label>
          <label className="check"><input type="checkbox" checked={f.isTeam} onChange={set("isTeam")} />Team event</label>
          <label className="check"><input type="checkbox" checked={f.isPaid} onChange={set("isPaid")} />Paid entry</label>
          {f.isTeam && <><label className="field">Min team size<input type="number" min="1" value={f.minTeam} onChange={set("minTeam")} /></label><label className="field">Max team size<input type="number" min="1" value={f.maxTeam} onChange={set("maxTeam")} /></label></>}
          {f.isPaid && <label className="field">Entry fee (₹)<input type="number" min="0" value={f.fee} onChange={set("fee")} /></label>}
        </div>
        {err && <div className="err" role="alert">{err}</div>}
        <div className="acts" style={{ marginTop: 18 }}><button className="btn" disabled={busy}>{busy ? "Saving…" : ev ? "Save changes" : "Save as draft"}</button><button type="button" className="btn ghost" onClick={close}>Cancel</button></div>
      </form>
    </Modal>
  );
}

function ConfirmBox() {
  const { confirm, setConfirm } = useK(); const close = () => setConfirm(null);
  return <Modal onClose={close} w={440} label={confirm.title}><div className="modal-b"><div className="modal-h"><h2>{confirm.title}</h2></div><p style={{ lineHeight: 1.55 }}>{confirm.text}</p><div className="acts" style={{ marginTop: 16 }}><button className="btn red" autoFocus onClick={() => { confirm.ok(); close(); }}>{confirm.cta}</button><button className="btn ghost" onClick={close}>Keep it</button></div></div></Modal>;
}

/* ---------- pages ---------- */
function Overview() {
  const { user, org, events, tasks, channels, go, setForm, setAttEvent } = useK();
  const sum = events.reduce((s, e) => s + e.registered_count, 0);
  const inGroup = (g) => events.filter((e) => GROUPS[g].includes(e.status));
  const upcoming = events.filter((e) => ["approved", "live"].includes(e.status) && new Date(e.end_datetime) > Date.now()).sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))[0];
  const fix = events.filter((e) => ["revision", "rejected"].includes(e.status));
  const late = tasks.filter((t) => t.col !== "done" && new Date(t.due) < Date.now());
  const chatUnread = channels.reduce((s, c) => s + c.unread, 0);
  const top = [...events].filter((e) => e.registered_count > 0).sort((a, b) => b.registered_count - a.registered_count).slice(0, 5);
  return (
    <>
      <header className="hero">
        <div className="plaque"><h1>{org?.org_name || "Organizer"} desk</h1><p>{org ? `${org.org_type} · ${org.follower_count ?? 0} followers · signed in as ${user.full_name}` : user.full_name}</p></div>
        <div className="stubs" aria-label="Your numbers">
          {[[inGroup("live").length, "Live or approved", -2], [inGroup("review").length, "In review", 1.5], [sum, "Registrations", -1], [tasks.filter((t) => t.col !== "done").length, "Open tasks", 2]].map(([n, l, r]) => <div className="stub" style={{ "--r": r + "deg" }} key={l}><b>{n}</b><span>{l}</span></div>)}
        </div>
      </header>
      {upcoming ? (
        <div className="tix-wrap"><section className="tix" aria-label="Next event">
          <div className="tix-main">
            <span className="tag mono">Next event · {upcoming.status}</span><h2>{upcoming.title}</h2>
            <div className="tix-meta"><div><b>{fmtDate(upcoming.start_datetime)}</b>{fmtTime(upcoming.start_datetime)}</div><div><b>{upcoming.venue_name || "Online"}</b>{upcoming.mode}</div><div><b>{upcoming.registered_count}/{upcoming.max_capacity}</b>registered</div></div>
            <div className="prog" role="img" aria-label="Registration progress"><i style={{ width: Math.min(100, (upcoming.registered_count / upcoming.max_capacity) * 100) + "%" }} /></div>
          </div>
          <div className="tix-stub"><button className="btn" onClick={() => { setAttEvent(upcoming.id); go("attendees"); }}>Open attendees</button><button className="btn ghost" onClick={() => go("team")}>Tasks</button></div>
        </section></div>
      ) : <div className="empty"><h2>No upcoming event</h2><p>Create an event and submit it for review to get it on the board.</p><button className="btn" onClick={() => setForm({})}>New event</button></div>}
      <div className="ov">
        <div>
          {(fix.length > 0 || late.length > 0 || chatUnread > 0) && <div className="sec-title"><h2>Needs your attention</h2></div>}
          {fix.map((e, i) => <div className="attn" key={e.id} style={{ "--r": (i % 2 ? 1 : -1) + "deg" }}><b>{e.title}</b> {e.status === "rejected" ? "was rejected" : "needs changes"}.<div style={{ margin: "6px 0 10px" }}>{e.rejection_reason || "No reason given."}</div><button className="btn sm" onClick={() => setForm({ event: e })}>Edit event</button></div>)}
          {late.length > 0 && <div className="attn" style={{ "--r": "1deg" }}><b>{late.length} overdue {late.length > 1 ? "tasks" : "task"}</b><div style={{ margin: "6px 0 10px" }}>{late.map((t) => t.title).join(" · ")}</div><button className="btn sm" onClick={() => go("team")}>Open task board</button></div>}
          {chatUnread > 0 && <div className="attn" style={{ "--r": "-1deg" }}><b>{chatUnread} unread {chatUnread > 1 ? "messages" : "message"}</b><div style={{ margin: "6px 0 10px" }}>Students and volunteers are waiting for a reply.</div><button className="btn sm" onClick={() => go("chat")}>Open chat</button></div>}
          <div className="sec-title"><h2>Registrations by event</h2></div>
          <section className="card" style={{ "--r": "-.4deg" }}><span className="pin" style={{ "--pin": "#1f6f68" }} />
            {top.length === 0 && <p style={{ opacity: .75 }}>No registrations yet.</p>}
            {top.map((e) => <div className="hbar" key={e.id}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span><div className="bar" role="img" aria-label={`${e.registered_count} of ${e.max_capacity}`}><i style={{ width: Math.min(100, (e.registered_count / e.max_capacity) * 100) + "%" }} /></div><span className="mono">{e.registered_count}</span></div>)}
          </section>
        </div>
        <aside className="side">
          <section className="card" style={{ "--r": "1deg" }}><span className="pin" /><h2>Latest sign-ups</h2>{MOCK_RECENT.map(([n, e, w]) => <div className="member" key={n}><span className="av">{initials(n)}</span><span>{n}<br /><span className="mono" style={{ opacity: .65 }}>{e}</span></span><span className="mono">{w}</span></div>)}</section>
        </aside>
      </div>
    </>
  );
}

function Events() {
  const { events, setForm, setStatus, removeEvent, setAttEvent, go, org } = useK();
  const [tab, setTab] = useState("all");
  const list = events.filter((e) => !GROUPS[tab] || GROUPS[tab].includes(e.status));
  return (
    <>
      <div className="plaque"><h1>My events</h1><p>Draft, submit for approval, and manage everything you run.</p></div>
      <div className="tools"><div className="chips" role="group" aria-label="Filter by status" style={{ flex: 1 }}>{[["all", "All"], ["draft", "Drafts"], ["review", "In review"], ["live", "Live"], ["past", "Past"]].map(([k, l]) => <button key={k} className="chip" aria-pressed={tab === k} onClick={() => setTab(k)}>{l} ({k === "all" ? events.length : events.filter((e) => GROUPS[k].includes(e.status)).length})</button>)}</div><button className="btn" onClick={() => setForm({})} disabled={!org}>＋ New event</button></div>
      {list.length === 0 && <div className="empty"><h2>Nothing here</h2><p>Events with this status will appear here.</p></div>}
      <div style={{ maxWidth: 900 }}>
        {list.map((e) => (
          <div className="mini" key={e.id} style={{ "--c": (CAT[e.category] || CAT.other)[0] }}>
            <div className="grow"><b>{e.title}</b><span className="mono">{fmtDate(e.start_datetime)} · {fmtTime(e.start_datetime)} · {e.venue_name || e.mode} · {e.is_paid ? `₹${e.entry_fee}` : "Free"}</span>
              <div className="prog" role="img" aria-label={`${e.registered_count} of ${e.max_capacity} registered`}><i style={{ width: Math.min(100, (e.registered_count / e.max_capacity) * 100) + "%" }} /></div></div>
            <span className={`pill ${e.status}`}>{statusLabel(e.status)}</span>
            <div className="acts" style={{ margin: 0 }}>
              {["draft", "revision", "pending", "approved", "live"].includes(e.status) && <button className="btn ghost sm" onClick={() => setForm({ event: e })}>Edit</button>}
              {["draft", "revision"].includes(e.status) && <button className="btn sm" onClick={() => setStatus(e, "pending")}>{e.status === "draft" ? "Submit for review" : "Resubmit"}</button>}
              {["approved", "live", "completed"].includes(e.status) && <button className="btn ghost sm" onClick={() => { setAttEvent(e.id); go("attendees"); }}>Attendees</button>}
              {["approved", "live"].includes(e.status) && <button className="btn ghost sm" onClick={() => removeEvent(e, "cancel")}>Cancel event</button>}
              {e.status === "draft" && <button className="btn ghost sm" onClick={() => removeEvent(e, "delete")}>Delete</button>}
            </div>
            {e.status === "revision" && e.rejection_reason && <div className="warn" style={{ width: "100%" }}><b>Admin note:</b> {e.rejection_reason}</div>}
            {e.status === "pending" && <span className="mono" style={{ width: "100%", opacity: .7 }}>Waiting for your college admin to approve.</span>}
          </div>
        ))}
      </div>
    </>
  );
}

function Attendees() {
  const { events, att, setAtt, attEvent, setAttEvent, setToast } = useK();
  const evs = events.filter((e) => e.registered_count > 0), id = attEvent && evs.find((e) => e.id === attEvent) ? attEvent : evs[0]?.id;
  const [q, setQ] = useState(""), [code, setCode] = useState("");
  if (!id) return <><div className="plaque"><h1>Attendees</h1></div><div className="empty"><h2>No registrations yet</h2><p>Once students register, you can check them in here.</p></div></>;
  const ev = events.find((e) => e.id === id), rows = att[id] || [];
  const patch = (rid, p) => setAtt((a) => ({ ...a, [id]: a[id].map((r) => (r.id === rid ? { ...r, ...p } : r)) }));
  const shown = rows.filter((r) => `${r.name} ${r.roll} ${r.team || ""}`.toLowerCase().includes(q.toLowerCase()));
  const scan = (e) => { e.preventDefault(); const r = rows.find((x) => x.qr.toLowerCase() === code.trim().toLowerCase()); if (!r) setToast("No ticket with that code"); else if (r.status !== "confirmed") setToast(`${r.name} is on the waitlist`); else { patch(r.id, { checked_in: true }); setToast(`Checked in ${r.name}`); } setCode(""); };
  const csv = () => download(`${ev.title.replace(/\W+/g, "-")}-attendees.csv`, ["Name,Roll,Branch,Team,Status,Checked in", ...rows.map((r) => [r.name, r.roll, r.branch, r.team || "", r.status, r.checked_in ? "yes" : "no"].join(","))].join("\n"), "text/csv");
  return (
    <>
      <div className="plaque"><h1>Attendees</h1><p>Check people in at the door, promote the waitlist, and export the list.</p></div>
      <div className="tools"><select value={id} onChange={(e) => setAttEvent(e.target.value)} aria-label="Event">{evs.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</select>
        <input className="search" type="search" placeholder="Search by name, roll number or team" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search attendees" /><button className="btn ghost" onClick={csv}>Export CSV</button></div>
      <div className="stubs" style={{ marginBottom: 22 }}>{[[rows.length, "Shown in list"], [rows.filter((r) => r.checked_in).length, "Checked in"], [rows.filter((r) => r.status === "waitlisted").length, "Waitlisted"]].map(([n, l], i) => <div className="stub" key={l} style={{ "--r": (i - 1) * 1.5 + "deg" }}><b>{n}</b><span>{l}</span></div>)}</div>
      <form className="tools" onSubmit={scan}><input className="search" value={code} onChange={(e) => setCode(e.target.value)} placeholder={`Scan or type a ticket code, e.g. ${rows[5]?.qr || "KNOT-E10"}`} aria-label="Ticket code" /><button className="btn">Check in</button></form>
      <div className="tblwrap"><table><thead><tr><th>Student</th><th>Roll no.</th><th>Team</th><th>Status</th><th>Check-in</th></tr></thead><tbody>
        {shown.map((r) => <tr key={r.id}><td><b>{r.name}</b><br /><span className="mono" style={{ opacity: .6 }}>{r.branch}</span></td><td className="mono">{r.roll}</td><td>{r.team || "—"}</td>
          <td>{r.status === "waitlisted" ? <><span className="pill waitlisted">waitlisted</span> <button className="btn sm" onClick={() => { patch(r.id, { status: "confirmed" }); setToast(`Promoted ${r.name}`); }}>Promote</button></> : <span className="pill confirmed">confirmed</span>}</td>
          <td><button className={`ci ${r.checked_in ? "on" : ""}`} aria-pressed={r.checked_in} disabled={r.status !== "confirmed"} onClick={() => patch(r.id, { checked_in: !r.checked_in })}>{r.checked_in ? "✓ In" : "Check in"}</button></td></tr>)}
        {shown.length === 0 && <tr><td colSpan="5" style={{ textAlign: "center", opacity: .7 }}>No attendees match.</td></tr>}</tbody></table></div>
      <p className="mono" style={{ margin: "10px 2px 0", opacity: .75 }}>Showing a sample of {rows.length} of {ev.registered_count} registrations (mock).</p>
    </>
  );
}

function Team() {
  const { events, tasks, setTasks, vols, setVols, setToast } = useK();
  const [eid, setEid] = useState(events.find((e) => e.status === "live")?.id || events[0]?.id), [t, setT] = useState({ title: "", who: ME, due: toLocalInput(at(2, 12)) }), [v, setV] = useState({ name: "", role: "Volunteer" });
  const list = tasks.filter((x) => x.event_id === eid);
  const move = (id, d) => setTasks((a) => a.map((x) => x.id === id ? { ...x, col: ["todo", "doing", "done"][Math.min(2, Math.max(0, ["todo", "doing", "done"].indexOf(x.col) + d))] } : x));
  const add = (e) => { e.preventDefault(); if (!t.title.trim()) return; setTasks((a) => [...a, { id: "k" + Date.now(), event_id: eid, title: t.title.trim(), who: t.who, due: new Date(t.due).toISOString(), col: "todo" }]); setT({ ...t, title: "" }); setToast("Task added"); };
  const cols = [["todo", "To do", "#b8321c"], ["doing", "In progress", "#b97a0c"], ["done", "Done", "#1f6f68"]];
  return (
    <>
      <div className="plaque"><h1>Team and tasks</h1><p>Coordinate volunteers, assign work and keep every event on schedule.</p></div>
      <div className="tools"><select value={eid} onChange={(e) => setEid(e.target.value)} aria-label="Event">{events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</select></div>
      <form className="card inline" onSubmit={add} style={{ marginBottom: 28 }}><span className="pin" style={{ "--pin": "#2c4a7c" }} />
        <label className="field">New task<input value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} placeholder="What needs doing?" /></label>
        <label className="field">Assign to<select value={t.who} onChange={(e) => setT({ ...t, who: e.target.value })}><option>{ME}</option>{vols.map((x) => <option key={x.id}>{x.name}</option>)}</select></label>
        <label className="field">Due<input type="datetime-local" value={t.due} onChange={(e) => setT({ ...t, due: e.target.value })} /></label>
        <button className="btn" disabled={!t.title.trim()}>Add task</button></form>
      <div className="board">
        {cols.map(([k, l, c]) => <section className="col" key={k} style={{ "--c": c }} aria-label={l}><h3>{l}<span className="mono">{list.filter((x) => x.col === k).length}</span></h3>
          {list.filter((x) => x.col === k).map((x, i) => <div className="task" key={x.id} style={{ "--r": ((i % 3) - 1) * 0.8 + "deg" }}><b>{x.title}</b><span className="mono">{x.who}</span><span className={`mono ${k !== "done" && new Date(x.due) < Date.now() ? "late" : ""}`}>{k !== "done" && new Date(x.due) < Date.now() ? "Overdue · " : "Due "}{fmtDate(x.due)}, {fmtTime(x.due)}</span>
            <div className="acts"><button aria-label="Move back" disabled={k === "todo"} onClick={() => move(x.id, -1)}>←</button><button aria-label="Move forward" disabled={k === "done"} onClick={() => move(x.id, 1)}>→</button><button aria-label="Delete task" onClick={() => setTasks((a) => a.filter((m) => m.id !== x.id))}>✕</button></div></div>)}
          {list.filter((x) => x.col === k).length === 0 && <p style={{ opacity: .6, fontSize: 14 }}>Nothing here.</p>}</section>)}
      </div>
      <div className="sec-title"><h2>Volunteers</h2></div>
      <section className="card" style={{ maxWidth: 640, "--r": "-.4deg" }}><span className="pin" style={{ "--pin": "#1f6f68" }} />
        {vols.map((x) => <div className="member" key={x.id}><span className="av">{initials(x.name)}</span><span>{x.name}</span><span className="pill confirmed">{x.role}</span><button className="btn ghost sm" aria-label={`Remove ${x.name}`} onClick={() => setVols((a) => a.filter((m) => m.id !== x.id))}>✕</button></div>)}
        <form className="acts" onSubmit={(e) => { e.preventDefault(); if (!v.name.trim()) return; setVols((a) => [...a, { id: "v" + Date.now(), ...v, name: v.name.trim() }]); setV({ name: "", role: "Volunteer" }); }}>
          <input className="search" style={{ minWidth: 0 }} placeholder="Student name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} aria-label="Volunteer name" />
          <select value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })} aria-label="Role">{["Volunteer", "Logistics", "Tech support", "Registration desk", "Sponsorship", "Hospitality"].map((r) => <option key={r}>{r}</option>)}</select><button className="btn sm">Add</button></form>
      </section>
    </>
  );
}

/* ---------- shell ---------- */
const NAV = [["overview", "Overview", "📋"], ["events", "Events", "🎪"], ["attendees", "Attendees", "✅"], ["team", "Team", "🧩"], ["chat", "Chat", "💬"]];

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { logout } = useUser();
  const [page, setPage] = useState("overview"), [user, setUser] = useState(null), [org, setOrg] = useState(null), [events, setEvents] = useState([]), [demo, setDemo] = useState(false), [blocked, setBlocked] = useState("");
  const [toast, setToast] = useState(""), [form, setForm] = useState(null), [confirm, setConfirm] = useState(null), [attEvent, setAttEvent] = useState(null);
  const [att, setAtt] = useState({}), [tasks, setTasks] = useState(MOCK_TASKS), [vols, setVols] = useState(MOCK_VOLS), [channels, setChannels] = useState(MOCK_CHANNELS); // MOCK

  useEffect(() => {
    (async () => {
      try {
        const u = await call("GET", "/users/profile");
        if (!["faculty", "college_admin", "super_admin", "organizer"].includes(u.role)) { setUser(u); return setBlocked("This dashboard is for faculty organizer accounts."); }
        // NOTE: faculty can't call /organizers today (admin-only). Add GET /organizers/me to your backend.
        const o = await call("GET", "/organizers/me").catch(() => null);
        const e = o ? (await call("GET", `/events?organizerId=${o.id}&limit=100`)).items : [];
        setUser(u); setOrg(o); setEvents(e);
      } catch { setDemo(true); setUser(MOCK_USER); setOrg(MOCK_ORG); setEvents(MOCK_EVENTS); }
    })();
  }, []);
  useEffect(() => { setAtt((p) => { const n = { ...p }; events.forEach((e) => { if (!n[e.id]) n[e.id] = genAttendees(e); }); return n; }); }, [events]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2800); return () => clearTimeout(t); }, [toast]);

  const go = (p) => { setPage(p); window.scrollTo({ top: 0 }); };
  const openProfile = () => navigate("/profile");
  const signOut = async () => { await logout(); navigate("/login", { replace: true }); };
  const patchEvent = (id, p) => setEvents((x) => x.map((e) => (e.id === id ? { ...e, ...p } : e)));

  const saveEvent = async (v, existing) => {
    if (demo) {
      const base = { short_description: v.shortDescription, long_description: v.longDescription, title: v.title, category: v.category, mode: v.mode, event_type: v.eventType, venue_name: v.venueName, start_datetime: v.startDatetime, end_datetime: v.endDatetime, registration_deadline: v.registrationDeadline, max_capacity: v.maxCapacity, is_team_event: v.isTeamEvent, min_team_size: v.minTeamSize ?? null, max_team_size: v.maxTeamSize ?? null, is_paid: v.isPaid, entry_fee: v.entryFee ?? null };
      if (existing) patchEvent(existing.id, base); else setEvents((x) => [{ id: "e" + Date.now(), status: "draft", registered_count: 0, ...base }, ...x]);
    } else if (existing) { patchEvent(existing.id, await call("PATCH", `/events/${existing.id}`, v)); }
    else { const c = await call("POST", "/events", { ...v, organizerId: org.id, collegeId: org.college_id }); setEvents((x) => [c, ...x]); }
    setToast(existing ? "Event updated" : "Draft saved. Submit it for review when you're ready.");
  };
  const setStatus = async (e, status) => {
    try { if (!demo) await call("PATCH", `/events/${e.id}/status`, { status }); patchEvent(e.id, { status, rejection_reason: null }); setToast(status === "pending" ? "Sent to your college admin for approval" : `Event ${status}`); }
    catch (x) { setToast(x.message); }
  };
  const removeEvent = (e, kind) => setConfirm({ title: kind === "delete" ? "Delete this draft?" : "Cancel this event?", text: kind === "delete" ? `"${e.title}" will be removed permanently.` : `Registered students will see "${e.title}" as cancelled.`, cta: kind === "delete" ? "Delete draft" : "Cancel event",
    ok: async () => { try { if (kind === "delete") { if (!demo) await call("DELETE", `/events/${e.id}`); setEvents((x) => x.filter((m) => m.id !== e.id)); } else await setStatus(e, "cancelled"); } catch (x) { setToast(x.message); } } });

  if (!user) return <div className="kd"><style>{css}</style><div className="nav"><div className="logo"><Knot />KNOT</div></div><div className="wrap"><div className="plaque"><h1>Setting up your desk…</h1></div><div className="flyers">{[0, 1, 2].map((i) => <div className="sk" key={i} />)}</div></div></div>;
  if (blocked) return <div className="kd"><style>{css}</style><div className="nav"><div className="logo"><Knot />KNOT</div></div><div className="wrap"><div className="plaque"><h1>Organizer access only</h1><p>{blocked}</p></div></div></div>;

  const chatUnread = channels.reduce((s, c) => s + c.unread, 0);
  const ctx = { user, org, events, demo, tasks, setTasks, vols, setVols, channels, att, setAtt, attEvent, setAttEvent, form, setForm, confirm, setConfirm, saveEvent, setStatus, removeEvent, go, setToast };
  return (
    <Ctx.Provider value={ctx}>
      <div className="kd"><style>{css}{CHAT_CSS}{ORG_CSS}</style>
        <div className="nav"><div className="logo"><Knot />KNOT <span className="mono" style={{ opacity: .6, marginLeft: 4 }}>organizer</span></div>
          <nav className="links" aria-label="Main">{NAV.map(([k, l]) => <button key={k} className="lnk" aria-current={page === k ? "page" : undefined} onClick={() => go(k)}>{l}{k === "chat" && chatUnread > 0 && <b className="dot">{chatUnread}</b>}</button>)}</nav>
          <button className="lnk" onClick={openProfile}>Profile</button>
          <button className="avatar" title="Open profile" aria-label="Open profile" onClick={openProfile}>{initials(user.full_name)}</button>
          <button className="btn ghost sm" onClick={signOut}>Log out</button></div>
        <div className="wrap">
          {demo && <p className="mono" style={{ background: "#e3a72a", display: "inline-block", padding: "4px 10px", margin: "0 0 16px", transform: "rotate(-1deg)" }}>Demo data. Sign in as a faculty organizer to see live events.</p>}
          {!demo && !org && <div className="alert" role="status">Your faculty account isn't linked to an organizer profile yet, or the backend has no <b>GET /organizers/me</b> route. Ask your college admin to create your organizer account.</div>}
          <div className="page" key={page}>
            {page === "overview" && <Overview />}{page === "events" && <Events />}{page === "attendees" && <Attendees />}{page === "team" && <Team />}
            {page === "chat" && <><div className="plaque"><h1>Chat</h1><p>Broadcast announcements, answer student questions and coordinate your team.</p></div><ChatPanel channels={channels} setChannels={setChannels} me={user.full_name} canPost={() => true} broadcast setToast={setToast} /></>}
          </div>
        </div>
        <nav className="tabbar" aria-label="Main mobile">{NAV.map(([k, l, ic]) => <button key={k} aria-current={page === k ? "page" : undefined} onClick={() => go(k)}><span aria-hidden="true">{ic}</span>{l}{k === "chat" && chatUnread > 0 ? ` (${chatUnread})` : ""}</button>)}</nav>
        {form && <EventForm />}{confirm && <ConfirmBox />}
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </Ctx.Provider>
  );
}