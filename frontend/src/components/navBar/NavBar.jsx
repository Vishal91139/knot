const NAV = [["home", "Home", "🏠"], ["explore", "Explore", "🔎"], ["registrations", "Tickets", "🎟️"], ["teams", "Teams", "🤝"], ["chat", "Chat", "💬"], ["profile", "Profile", "👤"]];

export default function NavBar() {

    <div className="nav">
        <div className="logo"><Knot />KNOT</div>
        <nav 
            className="links"
            aria-label="Main">
            {
                NAV.map(([k, l]) => 
                <button 
                    key={k} 
                    className="lnk" 
                    aria-current={page === k ? "page" : undefined} 
                    onClick={() => go(k)}
                >
                    {k === "registrations" ? "My registrations" : l}{k === "chat" && chatUnread > 0 && <b className="dot">{chatUnread}</b>}
                </button>)
            }
        </nav>
        <button 
            className="bell" 
            aria-label={`Notifications, ${unread} unread`} 
            onClick={() => setShowNotes(true)}
        >
            🔔{unread > 0 && <b>{unread}</b>}
        </button>
        <button 
            className="avatar" 
            aria-label="Open profile" 
            onClick={() => go("profile")}
        >
            {user.avatar_url ? <img src={user.avatar_url} alt="" /> : initials(user.full_name)}
        </button>
    </div>
}