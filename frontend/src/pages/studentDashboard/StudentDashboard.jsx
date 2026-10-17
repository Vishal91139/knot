import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

/* ============================================================
   KNOT — Student Dashboard (v5, brand theme)
   Live endpoints:  GET /users/profile, GET /events, GET /events/:id,
                    PATCH /users/update
   Mocked ("MOCK"): registrations, teams, leaderboard, notifications,
                    feedback, follows, saved events, points
   ============================================================ */

// In your Vite app, swap this for: import.meta.env.VITE_API_URL
const API = "http://localhost:8000/api/v1";
const api = async (path) => {
  const res = await fetch(`${API}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()).data;
};

/* ---------- MOCK DATA: replace when endpoints exist ---------- */
const ago = (h) => new Date(Date.now() - h * 36e5).toISOString();
const MOCK_USER = { full_name: "Vishal Kumar", email: "vishal@example.com", branch: "CSE", year_of_study: 3, roll_number: "1SG22CS000", is_verified: true, points: 340 };
const at = (d, h) => { const t = new Date(); t.setDate(t.getDate() + d); t.setHours(h, 0, 0, 0); return t; };
const mk = (o) => ({ mode: "offline", is_paid: false, is_team_event: false, ...o,
  start_datetime: at(o.d, o.h).toISOString(), end_datetime: new Date(at(o.d, o.h).getTime() + o.dur * 36e5).toISOString(), registration_deadline: at(o.d - 1, o.h).toISOString() });
const SPK = [{ name: "Dr. Meera Iyer", designation: "Director, Applied AI Lab", role: "judge" }, { name: "Arjun Rao", designation: "Staff Engineer, Razorpay", role: "mentor" }];
const MOCK_EVENTS = [
  mk({ id: "e1", title: "HackSapthagiri 24h", short_description: "Build something that ships by sunrise.", long_description: "Twenty-four hours, teams of two to four, one problem statement revealed at kickoff. Mentors from industry walk the floor all night, and the top three teams demo live to the judges. Food, caffeine and a quiet corner to nap are covered.", category: "hackathon", d: 3, h: 10, dur: 26, venue_name: "Main Auditorium", max_capacity: 120, registered_count: 96, is_team_event: true, min_team_size: 2, max_team_size: 4, organizer: { id: "o1", org_name: "CSE Department" }, tags: ["24h", "teams", "prizes"], event_speakers: SPK,
    event_schedule: [{ day_number: 1, title: "Kickoff and problem reveal", start_time: "10:00", end_time: "11:00", location: "Main Auditorium" }, { day_number: 1, title: "Mentor rounds", start_time: "15:00", end_time: "18:00", location: "Lab 3" }, { day_number: 2, title: "Final demos", start_time: "09:00", end_time: "11:30", location: "Main Auditorium" }] }),
  mk({ id: "e7", title: "Startup Pitch Night", short_description: "Five-minute pitches, honest feedback from founders.", long_description: "Student founders pitch to a panel of alumni and angel investors. Audience votes for the crowd favourite.", category: "other", d: 3, h: 18, dur: 3, venue_name: "Seminar Hall 1", max_capacity: 60, registered_count: 20, organizer: { id: "o6", org_name: "E-Cell" } }),
  mk({ id: "e5", title: "Papers & Chai: ML Reading Group", short_description: "One paper, one hour, strong opinions.", long_description: "This week: a recent paper on retrieval-augmented generation. Read it beforehand, bring one question.", category: "academic", d: 5, h: 17, dur: 1, venue_name: "Seminar Hall 2", max_capacity: 40, registered_count: 12, organizer: { id: "o4", org_name: "AI Club" } }),
  mk({ id: "e2", title: "Rangotsav Dance Battle", short_description: "Solo and crew rounds with live judging.", long_description: "Open to solo performers and crews of up to eight. Two rounds, with the finale on the open-air stage.", category: "cultural", d: 6, h: 16, dur: 4, venue_name: "Open Air Theatre", max_capacity: 200, registered_count: 200, is_paid: true, entry_fee: 100, organizer: { id: "o2", org_name: "Cultural Club" } }),
  mk({ id: "e3", title: "Intro to Rust, Online", short_description: "Ownership and borrowing in two hours.", long_description: "A hands-on session for people who know one other language. We'll build a small command-line tool and learn why the borrow checker is your friend.", category: "workshop", d: 9, h: 18, dur: 2, venue_name: "Google Meet", mode: "online", max_capacity: 80, registered_count: 31, organizer: { id: "o3", org_name: "Coding Club" }, event_speakers: [SPK[1]] }),
  mk({ id: "e6", title: "Circuit Breakers Tech Quiz", short_description: "Teams of two. Hardware, software, trivia.", long_description: "Four rounds from logic gates to Linux trivia. Teams of exactly two.", category: "technical", d: 11, h: 11, dur: 3, venue_name: "ECE Lab Block", max_capacity: 100, registered_count: 44, is_team_event: true, min_team_size: 2, max_team_size: 2, organizer: { id: "o5", org_name: "ECE Department" } }),
  mk({ id: "e4", title: "Inter-College Cricket Cup", short_description: "Knockout format, 12 teams from across Bengaluru.", long_description: "Squads of eleven plus two substitutes. Entry fee covers kit and refreshments for the full tournament.", category: "sports", d: 14, h: 8, dur: 33, venue_name: "College Ground", max_capacity: 150, registered_count: 60, is_paid: true, entry_fee: 250, is_team_event: true, min_team_size: 11, max_team_size: 13, organizer: { id: "o7", org_name: "Sports Department" } }),
  mk({ id: "e8", title: "Web3 Workshop", short_description: "Wallets, contracts and what to ignore.", long_description: "A beginner session on how blockchains work.", category: "workshop", d: -12, h: 10, dur: 3, venue_name: "Lab 2", max_capacity: 60, registered_count: 60, organizer: { id: "o3", org_name: "Coding Club" } }),
];
const MOCK_REGS = [{ event_id: "e1", status: "confirmed", qr: "KNOT-7F3A91" }, { event_id: "e3", status: "waitlisted", waitlist_position: 4 }, { event_id: "e8", status: "attended", qr: "KNOT-2B90CD" }];
const MOCK_INVITES = [{ id: "t1", team: "Null Pointers", event: "HackSapthagiri 24h", from: "Yashas V" }];
const MOCK_TEAMS = [{ id: "tm1", name: "Stack Overflowers", event: "Circuit Breakers Tech Quiz", leader: true, members: [{ n: "Vishal Kumar", s: "accepted", l: true }, { n: "Ananya R", s: "accepted" }, { n: "karthik@sapthagiri.edu", s: "pending" }] }];
const MOCK_NOTES = [
  { id: "n1", t: "ticket", text: "Registration confirmed for HackSapthagiri 24h", when: "2 hours ago", unread: true, go: "registrations" },
  { id: "n4", t: "team", text: "Yashas V invited you to join Null Pointers", when: "5 hours ago", unread: true, go: "teams" },
  { id: "n2", t: "wait", text: "You're waitlist #4 for Intro to Rust, Online", when: "Yesterday", unread: true, go: "registrations" },
  { id: "n3", t: "cert", text: "Your certificate for Web3 Workshop is ready", when: "3 days ago", unread: false, go: "registrations" },
];
const MOCK_BOARD = [{ name: "Ananya R", pts: 520 }, { name: "Rohan M", pts: 410 }, { name: "Vishal Kumar", pts: 340, me: true }, { name: "Divya S", pts: 295 }, { name: "Karthik B", pts: 240 }];

const S_ORG = "Prof. Rekha N";
const MOCK_CHANNELS = [
  { id: "s1", type: "announce", title: "HackSapthagiri · Announcements", sub: "From the organizers · read only", members: 96, unread: 2, messages: [
    { id: "a1", from: S_ORG, text: "Kickoff is at 10:00 in the Main Auditorium. Bring your college ID and a laptop charger.", at: ago(3) },
    { id: "a2", from: S_ORG, text: "Problem statements drop at 10:30 sharp. Teams of two to four only.", at: ago(1) }] },
  { id: "s2", type: "group", title: "HackSapthagiri · Participants", sub: "96 members", members: 96, unread: 1, messages: [
    { id: "p1", from: "Ananya R", text: "Is there a size limit for teams?", at: ago(5) },
    { id: "p2", from: S_ORG, text: "Two to four members per team.", at: ago(4) },
    { id: "p3", from: "Karthik B", text: "Do we need to bring our own laptops?", at: ago(2) }] },
  { id: "s3", type: "group", title: "Team: Stack Overflowers", sub: "3 members", members: 3, unread: 0, messages: [
    { id: "t1", from: "Ananya R", text: "Quiz is on the 11th. Practice tonight?", at: ago(7) },
    { id: "t2", from: "Vishal Kumar", text: "Yes, library at 7.", at: ago(6) }] },
  { id: "s4", type: "dm", title: "CSE Department (organizer)", sub: "Direct message", members: 2, unread: 0, messages: [
    { id: "d1", from: "Vishal Kumar", text: "Can we enter with a team of five?", at: ago(30) },
    { id: "d2", from: S_ORG, text: "Maximum is four per team. Please split into two.", at: ago(29) }] },
];
/* ------------------------------------------------------------- */

const CATS = ["all", "hackathon", "technical", "cultural", "sports", "workshop", "academic", "other"];
const CAT = {
  hackathon: ["#b8321c", "repeating-linear-gradient(0deg,#fff2 0 1px,transparent 1px 14px),repeating-linear-gradient(90deg,#fff2 0 1px,transparent 1px 14px)"],
  technical: ["#1f6f68", "radial-gradient(#fff3 2px,transparent 2.5px) 0 0/16px 16px"],
  cultural: ["#7d3a86", "repeating-radial-gradient(circle at 100% 100%,#fff2 0 6px,transparent 6px 14px)"],
  sports: ["#2f7a3a", "repeating-linear-gradient(45deg,#fff2 0 10px,transparent 10px 20px)"],
  workshop: ["#b97a0c", "repeating-linear-gradient(135deg,#0002 0 3px,transparent 3px 12px)"],
  academic: ["#2c4a7c", "repeating-linear-gradient(0deg,#fff2 0 1px,transparent 1px 10px)"],
  other: ["#5b4a3b", "radial-gradient(#fff2 1.5px,transparent 2px) 0 0/12px 12px"],
};
const LEVELS = [[0, "Newcomer"], [100, "Regular"], [250, "Insider"], [500, "Campus star"], [1000, "Legend"]];
const NOTE_ICON = { ticket: "🎟️", wait: "⏳", cert: "🏅", team: "🤝" };
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const fmtClock = (v) => /^\d{2}:\d{2}/.test(v) ? v : new Date(v).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const initials = (n = "") => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const overlaps = (a, b) => new Date(a.start_datetime) < new Date(b.end_datetime) && new Date(b.start_datetime) < new Date(a.end_datetime);
const closesIn = (e, now) => { const ms = new Date(e.registration_deadline) - now; if (ms <= 0) return "Registration closed"; const h = Math.floor(ms / 36e5); return h < 48 ? `Closes in ${h}h` : `Closes ${fmtDate(e.registration_deadline)}`; };
const useNow = (ms = 30000) => { const [n, setN] = useState(Date.now()); useEffect(() => { const t = setInterval(() => setN(Date.now()), ms); return () => clearInterval(t); }, [ms]); return n; };
const downloadICS = (e) => {
  const f = (i) => new Date(i).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//KNOT//EN", "BEGIN:VEVENT", `UID:${e.id}@knot`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(e.start_datetime)}`, `DTEND:${f(e.end_datetime || e.start_datetime)}`, `SUMMARY:${e.title}`, `LOCATION:${e.venue_name || "Online"}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" })); a.download = `${e.title.replace(/\W+/g, "-")}.ics`; a.click();
};

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .32 0 0 0 0 .18 0 0 0 0 .06 0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;
const PAPER = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .4 0 0 0 0 .3 0 0 0 0 .15 0 0 0 .13 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
.kd{--cork:#c9985f;--paper:#fbf5e6;--ink:#2a1d12;--red:#b8321c;--teal:#1f6f68;--gold:#e3a72a;--sticky:#f6df72;
 font-family:'Instrument Sans',sans-serif;color:var(--ink);min-height:100vh;
 background:${GRAIN},radial-gradient(ellipse at 50% 0,#d9ac76 0,var(--cork) 55%,#a87a47 100%);}
.kd *{box-sizing:border-box}
.kd h1,.kd h2,.kd h3{margin:0;font-weight:400}
.kd h1,.kd h2{font-family:'Cormorant Garamond',sans-serif;letter-spacing:.015em}
.kd .mono{font-family:'JetBrains Mono',monospace;font-size:12px}
.kd button{font:inherit;cursor:pointer;color:inherit}
.kd button:disabled{opacity:.5;cursor:not-allowed}
.kd :focus-visible{outline:3px solid var(--teal);outline-offset:3px}
.kd ul{margin:0;padding:0;list-style:none}
.kd p{margin:0}

/* top nav + mobile tab bar */
.kd .nav{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:18px;padding:10px clamp(14px,4vw,48px);background:var(--ink);color:var(--paper);box-shadow:0 4px 0 rgba(0,0,0,.25)}
.kd .logo{font-family:'Cormorant Garamond';font-size:26px;display:flex;align-items:center;gap:8px;letter-spacing:.04em}
.kd .links{display:flex;gap:4px;margin-left:12px;flex:1}
.kd .lnk{background:none;border:0;color:var(--paper);padding:6px 14px;border-radius:99px;font-size:14px;white-space:nowrap}
.kd .lnk:hover{background:#fff2}
.kd .lnk[aria-current=page]{background:var(--gold);color:var(--ink);font-weight:700}
.kd .bell{position:relative;background:none;border:0;font-size:20px;padding:4px 6px}
.kd .bell b{position:absolute;top:-2px;right:-4px;background:var(--red);color:#fff;font:700 10px 'JetBrains Mono';min-width:17px;height:17px;border-radius:9px;display:grid;place-items:center}
.kd .avatar{width:38px;height:38px;border-radius:50%;background:var(--gold);color:var(--ink);display:grid;place-items:center;font:700 14px 'JetBrains Mono';border:2px solid var(--paper);overflow:hidden;padding:0}
.kd .avatar img{width:100%;height:100%;object-fit:cover}
.kd .tabbar{display:none}
.kd .dot{background:var(--red);color:#fff;font:700 10px 'JetBrains Mono';border-radius:9px;padding:1px 6px;margin-left:6px}
@media(max-width:820px){
 .kd .links{display:none}.kd .nav{justify-content:space-between}
 .kd .tabbar{display:grid;grid-template-columns:repeat(6,1fr);position:fixed;bottom:0;left:0;right:0;z-index:30;background:var(--ink);padding:6px 4px calc(6px + env(safe-area-inset-bottom));box-shadow:0 -4px 14px #0006}
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
.kd .stub b{font:600 38px/1 'Cormorant Garamond';display:block}.kd .stub span{font-size:13px;opacity:.8}

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
.kd .tix-meta div{font-size:14px}.kd .tix-meta b{display:block;font:600 22px 'Cormorant Garamond'}
.kd .count{display:flex;gap:8px;margin-top:18px}
.kd .count div{background:var(--ink);color:var(--paper);padding:6px 12px;border-radius:3px;text-align:center;min-width:62px}
.kd .count b{font:600 26px/1 'Cormorant Garamond';display:block}.kd .count span{font:700 10px 'JetBrains Mono';opacity:.75}
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
.kd .fly-date{font:600 46px/.9 'Cormorant Garamond'}
.kd .fly-date small{display:block;font:700 12px 'JetBrains Mono';letter-spacing:.06em}
.kd .fly-cat{font:700 11px 'JetBrains Mono';background:#0004;padding:3px 8px;border-radius:2px;text-transform:capitalize}
.kd .heart{position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:50%;border:0;background:#fbf5e6;font-size:17px;box-shadow:0 2px 4px #0004;display:grid;place-items:center;color:var(--red)}
.kd .fly-body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:6px;flex:1}
.kd .tlink{background:none;border:0;padding:0;text-align:left;font-size:19px;font-weight:700;line-height:1.2}
.kd .tlink:hover{text-decoration:underline}
.kd .fly-body p{font-size:13.5px;opacity:.82}
.kd .by{font-size:12.5px;opacity:.7}
.kd .urgent{font:700 11px 'JetBrains Mono';color:var(--red)}
.kd .seats{margin-top:auto;padding-top:10px}
.kd .seats .mono{display:flex;justify-content:space-between;margin-bottom:5px}
.kd .bar{height:7px;background:#2a1d1222;border-radius:4px;overflow:hidden}
.kd .bar i{display:block;height:100%;background:var(--teal)}
.kd .bar i.hot{background:var(--gold)}.kd .bar i.full{background:var(--red)}
.kd .foot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px}
.kd .foot .r{display:flex;gap:6px;align-items:center}
.kd .price{font:600 22px 'Cormorant Garamond'}
.kd .btn{border:2px solid var(--ink);background:var(--gold);padding:7px 14px;border-radius:3px;font-weight:700;font-size:14px;box-shadow:2px 2px 0 var(--ink)}
.kd .btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:none}
.kd .btn.ghost{background:transparent;box-shadow:none}
.kd .btn.sm{padding:4px 10px;font-size:13px}
.kd .btn.red{background:var(--red);color:#fff}
.kd .stamp{position:absolute;right:10px;top:70px;z-index:3;border:3px solid;padding:2px 10px;font:700 13px 'JetBrains Mono';text-transform:uppercase;transform:rotate(-8deg);border-radius:4px;background:#fbf5e6ee;letter-spacing:.08em}
.kd .stamp.confirmed,.kd .stamp.attended{color:var(--teal)}.kd .stamp.waitlisted{color:var(--red)}
.kd .none{grid-column:1/-1;background:#fbf5e6dd;padding:22px;border-radius:3px;text-align:center}

/* registrations */
.kd .mini{display:flex;flex-wrap:wrap;align-items:center;gap:12px 14px;background:var(--paper) ${PAPER};padding:14px 18px;margin-bottom:14px;border-left:10px solid var(--c);box-shadow:0 2px 0 #0003,0 8px 12px #0003;border-radius:2px}
.kd .mini .grow{flex:1;min-width:200px}.kd .mini b{display:block;font-size:16px}
.kd .mini .acts{display:flex;gap:8px;flex-wrap:wrap}
.kd .pill{font:700 11px 'JetBrains Mono';border:2px solid;padding:2px 8px;border-radius:3px;text-transform:uppercase;white-space:nowrap}
.kd .pill.confirmed,.kd .pill.attended{color:var(--teal)}.kd .pill.waitlisted{color:var(--red)}
.kd .qrrow{display:flex;gap:18px;align-items:center;padding:14px 0 4px;border-top:2px dashed #2a1d1233;width:100%}
.kd .stars{display:flex;gap:2px}.kd .stars button{background:none;border:0;font-size:22px;padding:0 1px;color:#2a1d1244}.kd .stars button.on{color:var(--gold)}

/* cards, sticky, rank */
.kd .card{position:relative;background:var(--paper) ${PAPER};padding:26px 20px 18px;box-shadow:0 2px 0 #0003,0 12px 18px #0004;transform:rotate(var(--r,0deg))}
.kd .card h2{font-size:26px;margin-bottom:12px}
.kd .acts{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.kd .rank{display:flex;align-items:center;gap:12px;padding:8px 6px;border-top:1px dashed #2a1d1233}
.kd .rank:first-of-type{border-top:0}
.kd .rank .n{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font:700 12px 'JetBrains Mono';background:#2a1d1215}
.kd .rank:nth-of-type(1) .n{background:var(--gold)}.kd .rank:nth-of-type(2) .n{background:#cfd3d6}.kd .rank:nth-of-type(3) .n{background:#d49a6a}
.kd .rank span:nth-child(2){flex:1}
.kd .rank.me{background:linear-gradient(transparent 20%,#e3a72a88 20% 90%,transparent 90%);font-weight:700}
.kd .alert{background:var(--red);color:#fff;padding:16px 18px;margin-bottom:26px;border-radius:3px;box-shadow:0 8px 14px #0004}
.kd .alert button{background:none;border:0;color:#fff;text-decoration:underline;font-weight:700}

/* calendar */
.kd .cal{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:12.5px}
.kd .cal .h{font:700 10px 'JetBrains Mono';opacity:.6;padding:2px 0}
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
.kd .member .av{width:30px;height:30px;border-radius:50%;background:var(--gold);display:grid;place-items:center;font:700 11px 'JetBrains Mono'}
.kd .member span:nth-child(2){flex:1}
.kd .pgrid{display:grid;grid-template-columns:300px minmax(0,1fr);gap:34px;align-items:start}
@media(max-width:860px){.kd .pgrid{grid-template-columns:1fr}}
.kd .idc{position:relative;background:var(--paper) ${PAPER};padding:44px 22px 22px;text-align:center;box-shadow:0 2px 0 #0003,0 16px 24px #0005;transform:rotate(-1.2deg)}
.kd .idc::before{content:"";position:absolute;top:14px;left:50%;width:64px;height:12px;margin-left:-32px;border-radius:6px;background:#2a1d12;box-shadow:inset 0 2px 4px #000a}
.kd .idc .big{width:112px;height:112px;margin:0 auto 12px;border-radius:50%;background:var(--gold);display:grid;place-items:center;font:600 44px 'Cormorant Garamond';border:4px solid var(--ink);overflow:hidden}
.kd .idc .big img{width:100%;height:100%;object-fit:cover}
.kd .idc h2{font-size:28px}
.kd .vstamp{display:inline-block;margin-top:12px;border:3px solid;padding:2px 12px;font:700 13px 'JetBrains Mono';text-transform:uppercase;transform:rotate(-4deg);letter-spacing:.08em}
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
.kd .facts b{display:block;font:700 10px 'JetBrains Mono';opacity:.6;letter-spacing:.06em;text-transform:uppercase}
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
.kd .ch .u{background:var(--red);color:#fff;font:700 10px 'JetBrains Mono';min-width:19px;height:19px;border-radius:10px;display:grid;place-items:center;padding:0 5px}
.kd .thread{display:flex;flex-direction:column;min-width:0;min-height:0}
.kd .th{padding:12px 16px;border-bottom:2px dashed #2a1d1244;display:flex;gap:12px;align-items:center}
.kd .th .t{font-weight:700}.kd .th .back{display:none;background:none;border:2px solid var(--ink);border-radius:50%;width:34px;height:34px}
.kd .msgs{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#fffdf6aa}
.kd .msg{max-width:min(520px,84%);padding:9px 13px;border-radius:13px 13px 13px 3px;background:#fff;box-shadow:0 1px 0 #0003;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
.kd .msg.me{align-self:flex-end;background:var(--gold);border-radius:13px 13px 3px 13px}
.kd .msg.ann{align-self:stretch;max-width:none;background:var(--ink);color:var(--paper);border-radius:3px;border-left:6px solid var(--red)}
.kd .msg .who{font:700 11px 'JetBrains Mono';opacity:.65;margin-bottom:3px}
.kd .msg .at{font:10px 'JetBrains Mono';opacity:.55;text-align:right;margin-top:4px}
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


/* ---------- KNOT brand theme: cream, vermillion, stamp-green, ticket-stub perforation ---------- */
const THEME = `
.kd{--cork:#f6efe2;--paper:#fffaf0;--ink:#1f1a14;--red:#d9381e;--teal:#2f7a4d;--gold:#e0a63a;--sticky:#fdeee9;--line:#1f1a1422;
 font-family:'Instrument Sans',sans-serif;background:#f6efe2}
.kd h1,.kd h2,.kd h3{font-family:'Cormorant Garamond',serif;font-weight:600;letter-spacing:-.01em}
.kd .mono{font-family:'JetBrains Mono',monospace}
.kd .stub,.kd .fly,.kd .card,.kd .attn,.kd .task,.kd .idc,.kd .plaque,.kd .tix-wrap,.kd .sec-title h2,.kd .sticky,.kd .stamp{transform:none}
.kd .pin,.kd .attn::after,.kd .sticky::after,.kd .plaque::before,.kd .plaque::after,.kd .idc::before,.kd .stub::before{display:none}
.kd .stub,.kd .fly,.kd .card,.kd .mini,.kd .idc,.kd .modal,.kd .chat,.kd .tblwrap,.kd .sec-title h2,.kd .tix{background:var(--paper)}
/* nav */
.kd .nav{background:var(--paper);color:var(--ink);box-shadow:none;border-bottom:1px solid var(--line)}
.kd .logo{font:600 30px 'Cormorant Garamond',serif;letter-spacing:0}.kd .logo svg{stroke:var(--red)}
.kd .lnk{color:var(--ink);opacity:.68;border-radius:8px;position:relative}.kd .lnk:hover{background:#1f1a140d;opacity:1}
.kd .lnk[aria-current=page]{background:none;color:var(--red);opacity:1;font-weight:700}
.kd .lnk[aria-current=page]::after{content:"";position:absolute;left:50%;bottom:-3px;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:var(--red)}
.kd .avatar{background:var(--red);color:#fff;border:0}
.kd .bell{color:var(--ink)}
/* headers */
.kd .plaque{background:none;color:var(--ink);box-shadow:none;padding:0;margin-bottom:28px;max-width:64ch}
.kd .plaque h1{font-size:clamp(40px,5.6vw,68px);line-height:.98}
.kd .plaque h1::after{content:"";display:block;width:56px;height:4px;background:var(--red);margin-top:14px}
.kd .plaque p{opacity:.72;margin-top:12px;font-size:15.5px}
.kd .sec-title h2{background:none;box-shadow:none;padding:0;font-size:32px}
.kd .linkbtn{background:none;color:var(--red);padding:0;text-decoration:underline;text-underline-offset:3px}
.kd .found{background:none;color:var(--ink);padding:0;opacity:.7}
/* stubs, cards, rows */
.kd .stub{border:1px solid var(--line);border-left:5px solid var(--red);border-radius:10px;box-shadow:0 1px 2px #1f1a1410}
.kd .stub b{font:600 44px/1 'Cormorant Garamond',serif}
.kd .card,.kd .mini,.kd .idc,.kd .modal{border:1px solid var(--line);border-radius:12px;box-shadow:0 1px 3px #1f1a1414}
.kd .card{padding:22px 20px 18px}.kd .card h2{font-size:30px}
.kd .mini{border-left-width:6px}
.kd .idc .big{background:var(--red);color:#fff;border:0;font:600 46px 'Cormorant Garamond',serif}
.kd .alert{border-radius:10px;box-shadow:none}
.kd .empty{border:2px dashed #1f1a1440;border-radius:12px}
.kd .attn{background:#fdeee9;border:1px solid #d9381e33;border-left:5px solid var(--red);border-radius:10px;box-shadow:none}
.kd .task{background:var(--paper);border:1px solid var(--line);border-left:4px solid var(--red);border-radius:8px;box-shadow:none}
.kd .col{background:#efe6d3;border-radius:12px;box-shadow:none}
.kd .col h3{font:600 26px 'Cormorant Garamond',serif}
/* ticket */
.kd .tix-wrap{filter:drop-shadow(0 2px 6px #1f1a1426)}
.kd .tix-main h2{font-size:clamp(34px,4.6vw,58px)}
.kd .tix-meta b,.kd .price{font:600 24px 'Cormorant Garamond',serif}
.kd .tag{background:var(--red);border-radius:4px}
.kd .count div{background:var(--ink);border-radius:6px}.kd .count b{font:600 30px/1 'Cormorant Garamond',serif}
/* flyers */
.kd .flyers{gap:26px 22px}
.kd .fly{border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:0 1px 3px #1f1a1414}
.kd .fly:hover{transform:translateY(-3px);box-shadow:0 8px 20px #1f1a1422}
.kd .fly-head{height:92px}.kd .fly-date{font:600 52px/.9 'Cormorant Garamond',serif}
.kd .fly-cat{background:#0000004d}
.kd .tlink{font:600 22px/1.15 'Cormorant Garamond',serif}
.kd .stamp{top:62px;border-radius:4px;background:#fffaf0f2}
.kd .urgent{color:var(--red)}
/* controls */
.kd .btn{background:var(--red);color:#fff;border:1px solid var(--red);border-radius:8px;box-shadow:none;font-weight:600}
.kd .btn:hover:not(:disabled){background:#bf2f17}.kd .btn:active:not(:disabled){transform:scale(.97);box-shadow:none}
.kd .btn.ghost{background:transparent;color:var(--ink);border-color:#1f1a1445}.kd .btn.ghost:hover:not(:disabled){background:#1f1a140d}
.kd .btn.red{background:#8f1f0e;border-color:#8f1f0e}
.kd .chip{background:var(--paper);border:1px solid #1f1a1440;border-radius:99px}.kd .chip:hover{background:#1f1a140d}
.kd .chip[aria-pressed=true]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.kd .search,.kd select,.kd .field input,.kd .field select,.kd .field textarea,.kd .composer textarea{background:var(--paper);border:1px solid #1f1a1440;border-radius:8px}
.kd .search:focus,.kd select:focus,.kd .field input:focus,.kd .field textarea:focus,.kd .composer textarea:focus{outline:2px solid var(--red);outline-offset:1px}
.kd .x{background:var(--paper);border:1px solid #1f1a1440}
.kd .heart{box-shadow:0 1px 4px #0003}
.kd .rank.me{background:#d9381e14;font-weight:700}
.kd .rank:nth-of-type(1) .n{background:var(--gold)}
.kd th{background:#efe6d3;color:var(--ink)}
.kd .tblwrap{border:1px solid var(--line);border-radius:12px;box-shadow:none}
.kd .ci.on{background:var(--teal);border-color:var(--teal)}
/* chat */
.kd .chat{border:1px solid var(--line);border-radius:12px;box-shadow:none}
.kd .chat-list{background:#efe6d366}.kd .ch[aria-current=true]{background:#d9381e12}
.kd .ch .ic{background:var(--red)}
.kd .msgs{background:#fff8ec}.kd .msg.me{background:#fbe0d8}.kd .msg.ann{background:var(--ink)}
.kd .msg .who{font-family:'JetBrains Mono',monospace}
.kd .th .t{font:600 20px 'Cormorant Garamond',serif}
/* modals */
.kd .scrim{background:#1f1a1480}.kd .modal-h h2{font-size:34px}
.kd .facts{background:#efe6d3;border-radius:8px}
.kd .warn{background:#fdeee9;border:1px solid #d9381e44;border-radius:8px}
.kd .toast{background:var(--ink)}
/* mobile tab bar: vermillion dot indicator */
.kd .tabbar{background:var(--paper);border-top:1px solid var(--line);box-shadow:none}
.kd .tabbar button{color:var(--ink);opacity:.6;position:relative}
.kd .tabbar button[aria-current=page]{color:var(--red);opacity:1}
.kd .tabbar button[aria-current=page]::after{content:"";position:absolute;bottom:0;width:5px;height:5px;border-radius:50%;background:var(--red)}
@media(prefers-reduced-motion:no-preference){.kd .btn,.kd .chip,.kd .fly,.kd .lnk,.kd .card{transition:transform .15s ease-out,background-color .15s ease-out,box-shadow .15s ease-out}}
`;

const Ctx = createContext(null);
const useK = () => useContext(Ctx);
const PINS = ["#b8321c", "#1f6f68", "#b97a0c", "#2c4a7c"];
const BADGES = [["🎟️", "First event", true], ["💻", "Hackathon regular", true], ["🤝", "Team player", true], ["🎤", "Stage presence", false], ["🏆", "Podium finish", false]];
const Knot = () => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="#e3a72a" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true"><path d="M6 12c8-8 20-2 12 6s-14 6-8-2 16-8 14 0" /></svg>
);

function Modal({ onClose, active = true, w = 520, label, children }) {
  useEffect(() => {
    if (!active) return;
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [onClose, active]);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={label} style={{ "--w": w + "px" }}>{children}</div>
    </div>
  );
}

function Stars({ value = 0, onChange }) {
  return <div className="stars" role="group" aria-label="Rate this event">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={n <= value ? "on" : ""} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => onChange(n)}>★</button>)}</div>;
}

function Flyer({ e, i }) {
  const { regOf, register, saved, toggleSave, openDetail, now } = useK();
  const [color, pattern] = CAT[e.category] || CAT.other;
  const left = e.max_capacity - e.registered_count, pct = Math.min(100, Math.round((e.registered_count / e.max_capacity) * 100)), full = left <= 0;
  const d = new Date(e.start_datetime), reg = regOf(e.id), isSaved = saved.includes(e.id), cl = closesIn(e, now);
  return (
    <article className="fly" style={{ "--r": (((i * 37) % 5) - 2) * 0.7 + "deg", "--pin": PINS[i % 4] }}>
      <span className="pin" />
      {reg && <span className={`stamp ${reg.status}`}>{reg.status}</span>}
      <div className="fly-head" style={{ background: `${pattern}, ${color}` }}>
        <div className="fly-date">{d.getDate()}<small>{d.toLocaleString("en-IN", { month: "short" }).toUpperCase()} · {fmtTime(e.start_datetime)}</small></div>
        <span className="fly-cat">{e.category}</span>
        <button className="heart" aria-pressed={isSaved} aria-label={isSaved ? "Remove from saved" : "Save event"} onClick={() => toggleSave(e)}>{isSaved ? "♥" : "♡"}</button>
      </div>
      <div className="fly-body">
        <button className="tlink" onClick={() => openDetail(e.id)}>{e.title}</button>
        <p>{e.short_description}</p>
        <span className="by">{e.organizer?.org_name} · {e.venue_name || e.mode}{e.is_team_event ? " · Teams" : ""}</span>
        <span className="urgent">{cl}</span>
        <div className="seats">
          <div className="mono"><span>{full ? "Sold out" : `${left} seats left`}</span><span>{e.registered_count}/{e.max_capacity}</span></div>
          <div className="bar" role="img" aria-label={`${pct}% full`}><i className={full ? "full" : pct > 75 ? "hot" : ""} style={{ width: pct + "%" }} /></div>
        </div>
        <div className="foot">
          <span className="price">{e.is_paid ? `₹${e.entry_fee}` : "Free"}</span>
          <span className="r">
            <button className="btn ghost sm" onClick={() => openDetail(e.id)}>Details</button>
            {reg ? <span className="mono">Registered</span> : <button className="btn sm" onClick={() => register(e)}>{full ? "Waitlist" : "Register"}</button>}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ---------- event detail modal ---------- */
function Detail() {
  const { detail, closeDetail, byId, demo, regOf, register, cancel, saved, toggleSave, follows, toggleFollow, now } = useK();
  const base = byId[detail];
  const [extra, setExtra] = useState({}); const [tab, setTab] = useState("about");
  useEffect(() => { if (!demo && detail) api(`/events/${detail}`).then(setExtra).catch(() => {}); }, [detail, demo]);
  if (!base) return null;
  const e = { ...base, ...extra }, [color, pattern] = CAT[e.category] || CAT.other;
  const sched = e.event_schedule || [], spk = e.event_speakers || [], reg = regOf(e.id), org = e.organizer?.org_name;
  const full = e.registered_count >= e.max_capacity, closed = new Date(e.registration_deadline) < now;
  const isFollowing = follows.includes(org);
  return (
    <Modal onClose={closeDetail} w={880} label={e.title} active>
      <div className="dh" style={{ background: `${pattern}, ${color}` }}>
        <button className="x" onClick={closeDetail} aria-label="Close" autoFocus>✕</button>
        <span className="tag mono" style={{ background: "#0006" }}>{e.category} · {e.mode}{e.is_team_event ? " · team event" : ""}</span>
        <h2>{e.title}</h2>
        <p style={{ marginTop: 8, opacity: .9 }}>{e.short_description}</p>
      </div>
      <div className="dgrid">
        <div>
          <div className="chips" role="tablist" style={{ marginBottom: 12 }}>
            {[["about", "About"], ["schedule", `Schedule (${sched.length})`], ["speakers", `Speakers (${spk.length})`]].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className="chip" aria-pressed={tab === k} onClick={() => setTab(k)}>{l}</button>)}
          </div>
          {tab === "about" && <><p style={{ lineHeight: 1.6 }}>{e.long_description || e.short_description}</p>{e.tags?.length > 0 && <div className="chips" style={{ marginTop: 14 }}>{e.tags.map((t) => <span className="chip" key={t}>#{t}</span>)}</div>}</>}
          {tab === "schedule" && (sched.length === 0 ? <p style={{ opacity: .75 }}>The schedule hasn't been published yet.</p> : sched.map((s, i) => <div className="tl" key={i}><span className="mono">Day {s.day_number} · {fmtClock(s.start_time)}</span><span><b>{s.title}</b><br /><span style={{ fontSize: 13, opacity: .75 }}>{s.location} · until {fmtClock(s.end_time)}</span></span></div>))}
          {tab === "speakers" && (spk.length === 0 ? <p style={{ opacity: .75 }}>No speakers announced yet.</p> : spk.map((s, i) => <div className="member" key={i}><span className="av">{initials(s.name)}</span><span><b>{s.name}</b><br /><span style={{ fontSize: 13, opacity: .75 }}>{s.designation}</span></span><span className="pill waitlisted" style={{ color: "var(--teal)" }}>{s.role}</span></div>))}
        </div>
        <div className="facts">
          <div><b>When</b>{fmtDate(e.start_datetime)}, {fmtTime(e.start_datetime)} to {fmtTime(e.end_datetime)}</div>
          <div><b>Where</b>{e.venue_name || "Online"}</div>
          <div><b>Entry</b>{e.is_paid ? `₹${e.entry_fee}` : "Free"}</div>
          {e.is_team_event && <div><b>Team size</b>{e.min_team_size}{e.max_team_size !== e.min_team_size ? ` to ${e.max_team_size}` : ""} members</div>}
          <div><b>Seats</b>{e.max_capacity - e.registered_count} of {e.max_capacity} left</div>
          <div><b>Deadline</b>{closesIn(e, now)}</div>
          <div><b>Organizer</b>{org} <button className="btn ghost sm" style={{ marginLeft: 6 }} onClick={() => toggleFollow(org)}>{isFollowing ? "Following" : "Follow"}</button></div>
        </div>
      </div>
      <div className="modal-b" style={{ borderTop: "2px dashed #2a1d1233", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {reg ? <><span className={`pill ${reg.status}`}>{reg.status === "waitlisted" ? `waitlist #${reg.waitlist_position}` : reg.status}</span><button className="btn ghost" onClick={() => { cancel({ ...reg, event: e }); closeDetail(); }}>Cancel registration</button></>
          : <button className="btn" disabled={closed} onClick={() => register(e)}>{closed ? "Registration closed" : full ? "Join waitlist" : e.is_paid ? `Register · ₹${e.entry_fee}` : "Register"}</button>}
        <button className="btn ghost" onClick={() => toggleSave(e)}>{saved.includes(e.id) ? "♥ Saved" : "♡ Save"}</button>
        <button className="btn ghost" onClick={() => downloadICS(e)}>Add to calendar</button>
      </div>
    </Modal>
  );
}

function Conflict() {
  const { conflict, setConflict, doRegister } = useK();
  const close = () => setConflict(null);
  return (
    <Modal onClose={close} w={440} label="Schedule clash">
      <div className="modal-b">
        <div className="modal-h"><h2>Schedule clash</h2><button className="x" onClick={close} aria-label="Close" autoFocus>✕</button></div>
        <p style={{ lineHeight: 1.55 }}><b>{conflict.e.title}</b> overlaps with <b>{conflict.with.title}</b>, which you're already confirmed for ({fmtDate(conflict.with.start_datetime)}, {fmtTime(conflict.with.start_datetime)} to {fmtTime(conflict.with.end_datetime)}).</p>
        <div className="acts" style={{ marginTop: 16 }}>
          <button className="btn red" onClick={() => { doRegister(conflict.e); close(); }}>Register anyway</button>
          <button className="btn ghost" onClick={close}>Keep my plans</button>
        </div>
      </div>
    </Modal>
  );
}

function NotificationsModal() {
  const { notes, setNotes, setShowNotes, go, closeDetail } = useK();
  const [only, setOnly] = useState(false);
  const unread = notes.filter((n) => n.unread).length, list = only ? notes.filter((n) => n.unread) : notes;
  const close = () => setShowNotes(false);
  const open = (n) => { setNotes((x) => x.map((m) => m.id === n.id ? { ...m, unread: false } : m)); close(); closeDetail(); go(n.go); };
  return (
    <Modal onClose={close} label="Notifications">
      <div className="modal-b">
        <div className="modal-h"><h2>Notifications</h2><button className="x" onClick={close} aria-label="Close notifications" autoFocus>✕</button></div>
        <div className="chips" style={{ margin: "6px 0 10px" }}>
          <button className="chip" aria-pressed={!only} onClick={() => setOnly(false)}>All ({notes.length})</button>
          <button className="chip" aria-pressed={only} onClick={() => setOnly(true)}>Unread ({unread})</button>
        </div>
        {list.length === 0 && <p style={{ opacity: .75, padding: "14px 0" }}>You're all caught up.</p>}
        {list.map((n) => (
          <button key={n.id} className={`nrow ${n.unread ? "unread" : ""}`} onClick={() => open(n)}>
            <em>{NOTE_ICON[n.t]}</em><span>{n.text}<span className="mono">{n.when}</span></span>{n.unread && <i aria-label="unread" />}
          </button>
        ))}
        {unread > 0 && <button className="btn" style={{ marginTop: 14 }} onClick={() => setNotes((x) => x.map((n) => ({ ...n, unread: false })))}>Mark all read</button>}
      </div>
    </Modal>
  );
}

/* ---------- small widgets ---------- */
function Countdown({ to }) {
  const now = useK().now, ms = Math.max(0, new Date(to) - now);
  const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
  return <div className="count" role="timer" aria-label={`${d} days ${h} hours ${m} minutes to go`}>{[[d, "DAYS"], [h, "HRS"], [m, "MIN"]].map(([n, l]) => <div key={l}><b>{String(n).padStart(2, "0")}</b><span>{l}</span></div>)}</div>;
}

function MiniCalendar() {
  const { events, regs, now } = useK();
  const t = new Date(now), y = t.getFullYear(), mo = t.getMonth(), first = (new Date(y, mo, 1).getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
  const mine = new Set(), open = new Set();
  events.forEach((e) => { const d = new Date(e.start_datetime); if (d.getMonth() === mo && d.getFullYear() === y) (regs.find((r) => r.event_id === e.id && r.status !== "waitlisted") ? mine : open).add(d.getDate()); });
  return (
    <section className="card" style={{ "--r": "1deg" }} aria-label="Calendar">
      <span className="pin" style={{ "--pin": "#2c4a7c" }} />
      <h2>{t.toLocaleString("en-IN", { month: "long" })}</h2>
      <div className="cal">
        {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => <div className="h" key={i}>{l}</div>)}
        {Array.from({ length: first }).map((_, i) => <div key={"b" + i} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((d) => <div key={d} className={`d ${d === t.getDate() ? "today" : ""}`}>{d}{(mine.has(d) || open.has(d)) && <i className={mine.has(d) ? "mine" : ""} />}</div>)}
      </div>
      <div className="legend"><span className="m">Your events</span><span>Open events</span></div>
    </section>
  );
}

/* ---------- pages ---------- */
function Home() {
  const { user, regs, events, regOf, next, invites, acceptInvite, declineInvite, go, now } = useK();
  const soon = events.filter((e) => !regOf(e.id) && new Date(e.registration_deadline) > now).sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime)).slice(0, 4);
  return (
    <>
      <header className="hero">
        <div className="plaque"><h1>Hey {user.full_name?.split(" ")[0]}, here's your board</h1><p>{[user.branch, user.year_of_study && `Year ${user.year_of_study}`, user.roll_number].filter(Boolean).join(" · ")}</p></div>
        <div className="stubs" aria-label="Your numbers">
          {[[regs.filter((r) => r.status === "confirmed").length, "Confirmed", -2], [regs.filter((r) => r.status === "waitlisted").length, "Waitlisted", 1.5], [user.points ?? 0, "Points", -1]].map(([n, l, r]) => <div className="stub" style={{ "--r": r + "deg" }} key={l}><b>{n}</b><span>{l}</span></div>)}
        </div>
      </header>
      {!user.is_verified && <div className="alert" role="status"><b>Verify your student status.</b> Some events only take verified students. <button onClick={() => go("profile")}>Open your profile</button></div>}
      {next ? (
        <div className="tix-wrap"><section className="tix" aria-label="Your next event">
          <div className="tix-main">
            <span className="tag mono">Admit one</span>
            <h2>{next.event.title}</h2>
            <div className="tix-meta">
              <div><b>{fmtDate(next.event.start_datetime)}</b>{fmtTime(next.event.start_datetime)}</div>
              <div><b>{next.event.venue_name || "Online"}</b>{next.event.organizer?.org_name}</div>
              <div><b>{next.event.is_team_event ? "Team" : "Solo"}</b>entry</div>
            </div>
            <Countdown to={next.event.start_datetime} />
          </div>
          <div className="tix-stub"><div className="qr" role="img" aria-label="Entry QR code placeholder" /><div className="bars" aria-hidden="true" /><span className="mono">{next.qr}</span></div>
        </section></div>
      ) : <div className="empty"><h2>No ticket on your board yet</h2><p>Pin an event and your entry ticket shows up here.</p><button className="btn" onClick={() => go("explore")}>Explore events</button></div>}
      <div className="home-grid">
        <div>
          <div className="sec-title"><h2>Coming up</h2><button className="linkbtn" onClick={() => go("explore")}>See all events</button></div>
          <div className="flyers">{soon.length === 0 && <div className="none">You've registered for everything open right now.</div>}{soon.map((e, i) => <Flyer key={e.id} e={e} i={i} />)}</div>
        </div>
        <aside className="side">
          <MiniCalendar />
          <section className="card" style={{ "--r": "-1deg" }}>
            <span className="pin" style={{ "--pin": "#1f6f68" }} /><h2>Team invites</h2>
            {invites.length === 0 && <p style={{ opacity: .75 }}>No pending invites.</p>}
            {invites.map((i) => <div key={i.id}><b>{i.team}</b> for {i.event}<div className="mono">invited by {i.from}</div><div className="acts"><button className="btn sm" onClick={() => acceptInvite(i)}>Accept</button><button className="btn ghost sm" onClick={() => declineInvite(i)}>Decline</button></div></div>)}
          </section>
          <section className="card" style={{ "--r": "1deg" }}>
            <span className="pin" style={{ "--pin": "#b97a0c" }} /><h2>Campus leaderboard</h2>
            {MOCK_BOARD.map((p, i) => <div key={p.name} className={`rank ${p.me ? "me" : ""}`}><span className="n">{i + 1}</span><span>{p.name}</span><span className="mono">{p.pts} pts</span></div>)}
          </section>
        </aside>
      </div>
    </>
  );
}

function Explore() {
  const { events, saved, now } = useK();
  const [q, setQ] = useState(""), [cat, setCat] = useState("all"), [mode, setMode] = useState("any"), [price, setPrice] = useState("any"), [sort, setSort] = useState("soon"), [only, setOnly] = useState(false);
  const list = events
    .filter((e) => new Date(e.registration_deadline) > now && (cat === "all" || e.category === cat) && (mode === "any" || e.mode === mode) && (price === "any" || (price === "free" ? !e.is_paid : e.is_paid)) && (!only || saved.includes(e.id)) && (!q || `${e.title} ${e.short_description} ${e.organizer?.org_name || ""} ${(e.tags || []).join(" ")}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => sort === "soon" ? new Date(a.start_datetime) - new Date(b.start_datetime) : sort === "popular" ? b.registered_count - a.registered_count : (a.entry_fee || 0) - (b.entry_fee || 0));
  const reset = () => { setQ(""); setCat("all"); setMode("any"); setPrice("any"); setSort("soon"); setOnly(false); };
  return (
    <>
      <div className="plaque"><h1>Explore events</h1><p>Search everything open for registration. Tap a title for the full schedule and speakers.</p></div>
      <div className="tools">
        <input className="search" type="search" placeholder="Search by title, topic, club or tag" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events" />
        <select value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Mode"><option value="any">Any mode</option><option value="offline">Offline</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select>
        <select value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Price"><option value="any">Free or paid</option><option value="free">Free only</option><option value="paid">Paid only</option></select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"><option value="soon">Starting soonest</option><option value="popular">Most popular</option><option value="cheap">Lowest price</option></select>
      </div>
      <div className="chips" role="group" aria-label="Filter by category" style={{ marginBottom: 20 }}>
        {CATS.map((c) => <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
        <button className="chip" aria-pressed={only} onClick={() => setOnly(!only)}>♥ Saved ({saved.length})</button>
      </div>
      <p className="found mono">{list.length} {list.length === 1 ? "event" : "events"} found</p>
      <div className="flyers">
        {list.length === 0 && <div className="none">Nothing matches those filters. <button className="btn sm" style={{ marginLeft: 8 }} onClick={reset}>Clear filters</button></div>}
        {list.map((e, i) => <Flyer key={e.id} e={e} i={i} />)}
      </div>
    </>
  );
}

function Registrations() {
  const { myEvents, cancel, go, feedback, setFeedback, setToast, now } = useK();
  const [tab, setTab] = useState("upcoming"), [open, setOpen] = useState(null);
  const past = (r) => new Date(r.event.end_datetime) < now || r.status === "attended";
  const groups = { upcoming: myEvents.filter((r) => r.status === "confirmed" && !past(r)), waitlisted: myEvents.filter((r) => r.status === "waitlisted"), past: myEvents.filter(past) };
  const list = groups[tab];
  return (
    <>
      <div className="plaque"><h1>My registrations</h1><p>Tickets, waitlist spots and everything you've attended.</p></div>
      <div className="chips" role="group" aria-label="Filter registrations" style={{ marginBottom: 22 }}>
        {[["upcoming", "Upcoming"], ["waitlisted", "Waitlisted"], ["past", "Past"]].map(([k, l]) => <button key={k} className="chip" aria-pressed={tab === k} onClick={() => setTab(k)}>{l} ({groups[k].length})</button>)}
      </div>
      {list.length === 0 && <div className="empty"><h2>Nothing here yet</h2><p>{tab === "past" ? "Events you attend will show up here with certificates." : "Find an event and register to see it here."}</p><button className="btn" onClick={() => go("explore")}>Explore events</button></div>}
      <div style={{ maxWidth: 840 }}>
        {list.map((r) => (
          <div className="mini" key={r.event_id} style={{ "--c": (CAT[r.event.category] || CAT.other)[0] }}>
            <div className="grow"><b>{r.event.title}</b><span className="mono">{fmtDate(r.event.start_datetime)} · {fmtTime(r.event.start_datetime)} · {r.event.venue_name} · {r.event.is_paid ? `₹${r.event.entry_fee}` : "Free"}</span></div>
            <span className={`pill ${r.status}`}>{r.status === "waitlisted" ? `waitlist #${r.waitlist_position}` : r.status}</span>
            <div className="acts" style={{ margin: 0 }}>
              {tab === "upcoming" && <><button className="btn ghost sm" aria-expanded={open === r.event_id} onClick={() => setOpen(open === r.event_id ? null : r.event_id)}>{open === r.event_id ? "Hide ticket" : "Show ticket"}</button><button className="btn ghost sm" onClick={() => downloadICS(r.event)}>Add to calendar</button></>}
              {tab !== "past" && <button className="btn ghost sm" onClick={() => cancel(r)}>Cancel</button>}
              {tab === "past" && <button className="btn sm" onClick={() => setToast("Certificate downloading…")}>Certificate</button>}
            </div>
            {tab === "past" && <div className="qrrow" style={{ paddingTop: 10 }}><span style={{ fontSize: 14 }}>{feedback[r.event_id] ? "Thanks for your feedback" : "How was it?"}</span><Stars value={feedback[r.event_id]} onChange={(n) => { setFeedback((f) => ({ ...f, [r.event_id]: n })); setToast("Feedback sent"); }} /></div>}
            {open === r.event_id && <div className="qrrow"><div className="qr" role="img" aria-label="Entry QR code placeholder" /><div><div className="bars" style={{ width: 160, marginBottom: 8 }} aria-hidden="true" /><span className="mono">{r.qr}</span><br /><span style={{ fontSize: 13, opacity: .75 }}>Show this at the entry desk.</span></div></div>}
          </div>
        ))}
      </div>
    </>
  );
}

function Teams() {
  const { teams, setTeams, events, user, setToast, invites, acceptInvite, declineInvite } = useK();
  const [name, setName] = useState(""), [ev, setEv] = useState(""), [inv, setInv] = useState({});
  const teamEvents = events.filter((e) => e.is_team_event && new Date(e.registration_deadline) > Date.now());
  const create = (e) => { e.preventDefault(); const evt = teamEvents.find((x) => x.id === ev) || teamEvents[0]; if (!name.trim() || !evt) return; setTeams((t) => [...t, { id: "tm" + Date.now(), name: name.trim(), event: evt.title, leader: true, members: [{ n: user.full_name, s: "accepted", l: true }] }]); setName(""); setToast(`Team ${name.trim()} created`); };
  const invite = (t) => { const v = (inv[t.id] || "").trim(); if (!v) return; setTeams((x) => x.map((m) => m.id === t.id ? { ...m, members: [...m.members, { n: v, s: "pending" }] } : m)); setInv((x) => ({ ...x, [t.id]: "" })); setToast(`Invite sent to ${v}`); };
  return (
    <>
      <div className="plaque"><h1>Your teams</h1><p>Create a squad for team events and invite classmates by college email.</p></div>
      {invites.length > 0 && <div className="teams" style={{ marginBottom: 30 }}>{invites.map((i) => <section className="card" key={i.id} style={{ "--r": "-1deg" }}><span className="pin" /><h2>Invite: {i.team}</h2><p>{i.event}</p><div className="mono" style={{ marginTop: 4 }}>from {i.from}</div><div className="acts"><button className="btn sm" onClick={() => acceptInvite(i)}>Accept</button><button className="btn ghost sm" onClick={() => declineInvite(i)}>Decline</button></div></section>)}</div>}
      <div className="teams">
        <form className="card" onSubmit={create} style={{ "--r": ".8deg" }}>
          <span className="pin" style={{ "--pin": "#1f6f68" }} /><h2>Create a team</h2>
          <div className="form" style={{ gridTemplateColumns: "1fr" }}>
            <label className="field">Team name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
            <label className="field">Event<select value={ev} onChange={(e) => setEv(e.target.value)}>{teamEvents.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</select></label>
          </div>
          <div className="acts"><button className="btn" disabled={!name.trim() || teamEvents.length === 0}>Create team</button></div>
        </form>
        {teams.map((t, i) => (
          <section className="card" key={t.id} style={{ "--r": (i % 2 ? 1 : -1) * 0.7 + "deg" }}>
            <span className="pin" style={{ "--pin": PINS[i % 4] }} /><h2>{t.name}</h2><p className="mono" style={{ marginBottom: 8 }}>{t.event}</p>
            {t.members.map((m, j) => <div className="member" key={j}><span className="av">{initials(m.n)}</span><span>{m.n}{m.l ? " (leader)" : ""}</span><span className={`pill ${m.s === "accepted" ? "confirmed" : "waitlisted"}`}>{m.s}</span></div>)}
            {t.leader && <div className="acts"><input className="search" style={{ minWidth: 0 }} placeholder="Invite by college email" aria-label="Invite by email" value={inv[t.id] || ""} onChange={(e) => setInv((x) => ({ ...x, [t.id]: e.target.value }))} /><button className="btn sm" onClick={() => invite(t)}>Invite</button></div>}
          </section>
        ))}
      </div>
    </>
  );
}

function Profile() {
  const { user, setUser, demo, setToast, follows, toggleFollow } = useK();
  const [f, setF] = useState({ fullName: user.full_name || "", collegeEmail: user.college_email || "", branch: user.branch || "", rollNumber: user.roll_number || "", yearOfStudy: user.year_of_study ?? "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const dirty = f.fullName !== (user.full_name || "") || f.collegeEmail !== (user.college_email || "") || f.branch !== (user.branch || "") || f.rollNumber !== (user.roll_number || "") || String(f.yearOfStudy) !== String(user.year_of_study ?? "");
  const pts = user.points ?? 0, li = LEVELS.reduce((a, [min], i) => (pts >= min ? i : a), 0), nextL = LEVELS[li + 1];
  const save = async (ev) => {
    ev.preventDefault(); setSaving(true);
    try {
      let updated = { full_name: f.fullName, college_email: f.collegeEmail || null, branch: f.branch, roll_number: f.rollNumber, year_of_study: f.yearOfStudy === "" ? null : Number(f.yearOfStudy) };
      if (!demo) {
        const res = await fetch(`${API}/users/update`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: f.fullName, collegeEmail: f.collegeEmail, branch: f.branch, rollNumber: f.rollNumber, yearOfStudy: f.yearOfStudy }) });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Update failed");
        updated = (await res.json()).data;
      }
      setUser((u) => ({ ...u, ...updated })); setToast("Profile saved");
    } catch (err) { setToast(err.message || "Couldn't save. Try again."); }
    setSaving(false);
  };
  return (
    <>
      <div className="plaque"><h1>Your profile</h1><p>This is how organizers and your college see you.</p></div>
      <div className="pgrid">
        <div className="idc">
          <div className="big">{user.avatar_url ? <img src={user.avatar_url} alt="" /> : initials(user.full_name)}</div>
          <h2>{user.full_name}</h2>
          <p style={{ marginTop: 4, opacity: .8 }}>{[user.branch, user.year_of_study && `Year ${user.year_of_study}`].filter(Boolean).join(" · ")}</p>
          <p className="mono" style={{ marginTop: 6 }}>{user.roll_number}</p>
          <span className={`vstamp ${user.is_verified ? "ok" : "no"}`}>{user.is_verified ? "Verified student" : "Not verified"}</span>
          <div className="lvl"><div className="mono"><span>{LEVELS[li][1]}</span><span>{nextL ? `${nextL[0] - pts} pts to ${nextL[1]}` : "Max level"}</span></div><div className="bar" role="img" aria-label="Level progress"><i style={{ width: nextL ? ((pts - LEVELS[li][0]) / (nextL[0] - LEVELS[li][0])) * 100 + "%" : "100%" }} /></div></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <form className="card" onSubmit={save}>
            <span className="pin" /><h2>Edit details</h2>
            <div className="form">
              <label className="field wide">Full name<input value={f.fullName} onChange={set("fullName")} required /></label>
              <label className="field wide">College email<input type="email" value={f.collegeEmail} onChange={set("collegeEmail")} placeholder="you@yourcollege.edu" /></label>
              <label className="field">Branch<input value={f.branch} onChange={set("branch")} /></label>
              <label className="field">Year of study<input type="number" min="1" max="8" value={f.yearOfStudy} onChange={set("yearOfStudy")} /></label>
              <label className="field wide">Roll number<input value={f.rollNumber} onChange={set("rollNumber")} /></label>
              <label className="field wide">Personal email<input value={user.email || ""} disabled /></label>
            </div>
            <div className="acts" style={{ marginTop: 16 }}><button className="btn" disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</button></div>
          </form>
          <section className="card" style={{ "--r": "-.6deg" }}><span className="pin" style={{ "--pin": "#b97a0c" }} /><h2>Badges</h2><div className="badges">{BADGES.map(([ic, n, on]) => <div key={n} className={`badge ${on ? "" : "lock"}`}><div>{ic}</div>{n}</div>)}</div></section>
          <section className="card" style={{ "--r": ".5deg" }}><span className="pin" style={{ "--pin": "#2c4a7c" }} /><h2>Following</h2>
            {follows.length === 0 ? <p style={{ opacity: .75 }}>Follow a club from an event page to hear about its next event first.</p> : follows.map((o) => <div className="member" key={o}><span className="av">{initials(o)}</span><span>{o}</span><button className="btn ghost sm" onClick={() => toggleFollow(o)}>Unfollow</button></div>)}
          </section>
        </div>
      </div>
    </>
  );
}

/* ---------- shell ---------- */
const NAV = [["home", "Home", "🏠"], ["explore", "Explore", "🔎"], ["registrations", "Tickets", "🎟️"], ["teams", "Teams", "🤝"], ["chat", "Chat", "💬"], ["profile", "Profile", "👤"]];

export default function StudentDashboard() {
  const [page, setPage] = useState("home"), [user, setUser] = useState(null), [events, setEvents] = useState([]), [demo, setDemo] = useState(false);
  const [toast, setToast] = useState(""), [showNotes, setShowNotes] = useState(false), [detail, setDetail] = useState(null), [conflict, setConflict] = useState(null);
  const [regs, setRegs] = useState(MOCK_REGS), [notes, setNotes] = useState(MOCK_NOTES), [invites, setInvites] = useState(MOCK_INVITES), [teams, setTeams] = useState(MOCK_TEAMS); // MOCK
  const [channels, setChannels] = useState(MOCK_CHANNELS); // MOCK
  const [saved, setSaved] = useState(["e2"]), [follows, setFollows] = useState(["Coding Club"]), [feedback, setFeedback] = useState({});                                        // MOCK
  const now = useNow();

  useEffect(() => {
    (async () => {
      try { const [u, e] = await Promise.all([api("/users/profile"), api("/events?status=live&limit=50")]); setUser(u); setEvents(e.items); }
      catch { setDemo(true); setUser(MOCK_USER); setEvents(MOCK_EVENTS); }
    })();
  }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2800); return () => clearTimeout(t); }, [toast]);

  const byId = useMemo(() => Object.fromEntries(events.map((e) => [e.id, e])), [events]);
  const regOf = (id) => regs.find((r) => r.event_id === id);
  const myEvents = regs.map((r) => ({ ...r, event: byId[r.event_id] })).filter((r) => r.event);
  const next = myEvents.filter((r) => r.status === "confirmed" && new Date(r.event.end_datetime) > now).sort((a, b) => new Date(a.event.start_datetime) - new Date(b.event.start_datetime))[0];
  const unread = notes.filter((n) => n.unread).length;
  const chatUnread = channels.reduce((s, c) => s + c.unread, 0);

  const go = (p) => { setPage(p); setDetail(null); window.scrollTo({ top: 0 }); };
  // MOCK: swap for POST /events/:id/register and DELETE once the routes exist
  const doRegister = (e) => {
    const full = e.registered_count >= e.max_capacity;
    setRegs((r) => [...r, full ? { event_id: e.id, status: "waitlisted", waitlist_position: 1 } : { event_id: e.id, status: "confirmed", qr: "KNOT-" + String(e.id).slice(0, 6).toUpperCase() }]);
    setToast(full ? `You're on the waitlist for ${e.title}` : `Registered for ${e.title}. Ticket added to Tickets.`);
  };
  const register = (e) => {
    const clash = myEvents.find((r) => r.status === "confirmed" && r.event_id !== e.id && overlaps(r.event, e));
    if (clash && e.registered_count < e.max_capacity) setConflict({ e, with: clash.event }); else doRegister(e);
  };
  const cancel = (r) => { setRegs((x) => x.filter((m) => m.event_id !== r.event_id)); setToast(`Cancelled ${r.event.title}`); };
  const toggleSave = (e) => { const on = saved.includes(e.id); setSaved((s) => on ? s.filter((i) => i !== e.id) : [...s, e.id]); setToast(on ? "Removed from saved" : "Saved to your list"); };
  const toggleFollow = (o) => { const on = follows.includes(o); setFollows((s) => on ? s.filter((i) => i !== o) : [...s, o]); setToast(on ? `Unfollowed ${o}` : `Following ${o}`); };
  const acceptInvite = (i) => { setInvites((x) => x.filter((n) => n.id !== i.id)); setTeams((t) => [...t, { id: i.id, name: i.team, event: i.event, leader: false, members: [{ n: i.from, s: "accepted", l: true }, { n: user.full_name, s: "accepted" }] }]); setToast(`You joined ${i.team}`); };
  const declineInvite = (i) => setInvites((x) => x.filter((n) => n.id !== i.id));

  const ctx = { user, setUser, demo, events, byId, regs, regOf, myEvents, next, register, doRegister, cancel, saved, toggleSave, follows, toggleFollow, detail, openDetail: setDetail, closeDetail: () => setDetail(null), conflict, setConflict, notes, setNotes, setShowNotes, invites, acceptInvite, declineInvite, teams, setTeams, feedback, setFeedback, go, setToast, now };

  if (!user) return (
    <div className="kd"><style>{css}{THEME}</style><div className="nav"><div className="logo"><Knot />KNOT</div></div>
      <div className="wrap"><div className="plaque"><h1>Pinning up your board…</h1></div><div className="flyers">{[0, 1, 2].map((i) => <div className="sk" key={i} />)}</div></div></div>
  );

  return (
    <Ctx.Provider value={ctx}>
      <div className="kd">
        <style>{css}{CHAT_CSS}{THEME}</style>
        <div className="nav">
          <div className="logo"><Knot />KNOT</div>
          <nav className="links" aria-label="Main">{NAV.map(([k, l]) => <button key={k} className="lnk" aria-current={page === k ? "page" : undefined} onClick={() => go(k)}>{k === "registrations" ? "My registrations" : l}{k === "chat" && chatUnread > 0 && <b className="dot">{chatUnread}</b>}</button>)}</nav>
          <button className="bell" aria-label={`Notifications, ${unread} unread`} onClick={() => setShowNotes(true)}>🔔{unread > 0 && <b>{unread}</b>}</button>
          <button className="avatar" aria-label="Open profile" onClick={() => go("profile")}>{user.avatar_url ? <img src={user.avatar_url} alt="" /> : initials(user.full_name)}</button>
        </div>
        <div className="wrap">
          {demo && <p className="mono" style={{ background: "#e3a72a", display: "inline-block", padding: "4px 10px", margin: "0 0 16px", transform: "rotate(-1deg)" }}>Demo data. Sign in and start the backend to see live events.</p>}
          <div className="page" key={page}>
            {page === "home" && <Home />}{page === "explore" && <Explore />}{page === "registrations" && <Registrations />}{page === "teams" && <Teams />}{page === "chat" && <><div className="plaque"><h1>Chat</h1><p>Organizer announcements, event rooms, your teams and direct messages.</p></div><ChatPanel channels={channels} setChannels={setChannels} me={user.full_name} canPost={(c) => c.type !== "announce"} setToast={setToast} /></>}{page === "profile" && <Profile />}
          </div>
        </div>
        <nav className="tabbar" aria-label="Main mobile">{NAV.map(([k, l, ic]) => <button key={k} aria-current={page === k ? "page" : undefined} onClick={() => go(k)}><span aria-hidden="true">{ic}</span>{l}{k === "chat" && chatUnread > 0 ? ` (${chatUnread})` : ""}</button>)}</nav>
        {detail && <Detail />}
        {conflict && <Conflict />}
        {showNotes && <NotificationsModal />}
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </Ctx.Provider>
  );
}