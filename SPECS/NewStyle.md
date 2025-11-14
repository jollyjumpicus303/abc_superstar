<style>
    :root{
      --radius: 22px;
      --shadow-1: 0 8px 22px rgba(0,0,0,.35);
      --shadow-2: 0 14px 40px rgba(0,0,0,.5);
      --ring: 0 0 0 3px rgba(255,255,255,.18);
      --tile-size: 64px;
    }
    *{box-sizing:border-box}
    html,body{height:100%}
    body{margin:0; font-family:"Inter", system-ui, -apple-system, Segoe UI, Roboto, "Arial Rounded MT Bold", Arial, sans-serif; background:#0f0f13;

    .wrap{max-width:1200px; margin:40px auto; padding:0 20px}
    .caption{font: 800 28px "Baloo 2", cursive; letter-spacing:.3px; margin:0 0 18px}

    .demo{border-radius:28px; overflow:hidden; box-shadow:var(--shadow-2)}

    .bar{display:flex; align-items:center; justify-content:space-between; padding:16px 20px; position:sticky; top:0; background:linear-gradient(180deg,#131433 0%, rgba(19,20,51,0.4) 100%); border-bottom:1px solid rgba(255,255,255,.06)}
    .brand{display:flex; gap:10px; align-items:center}
    .logo{width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg,#8ec5fc,#e0c3fc); box-shadow:0 4px 18px rgba(142,197,252,.35)}
    .title{font:800 22px "Baloo 2", cursive; color:#f3e8ff}

    .tabs{display:flex; gap:12px}
    .tab{padding:10px 16px; border-radius:999px; font-weight:700; border:0; cursor:pointer; background:#2a2950; color:#e9e2ff}
    .tab[aria-selected="true"]{background:#335c9e; box-shadow:0 6px 16px rgba(100,150,255,.35)}

    .shell{display:flex; justify-content:center; padding:36px; background:radial-gradient(1200px 600px at 10% -20%, rgba(110,150,255,.25) 0%, transparent 60%), radial-gradient(1000px 600px at 110% 0%, rgba(112,225,255,.25) 0%, transparent 60%), #0f1022;}
    .card{width:min(980px, 92vw); border-radius:28px; padding:26px; background:#1b1b36; box-shadow:var(--shadow-1)}

    .h1{font:800 28px "Baloo 2", cursive; margin:0 0 6px; color:#f3e8ff}
    .muted{opacity:.8; margin:0 0 20px; color:#c8d8ff}

    .alphabet{display:flex; flex-wrap:wrap; gap:14px; margin-top:14px}
    .tile{display:inline-flex; align-items:center; justify-content:center; width:var(--tile-size); height:var(--tile-size); border-radius:18px; font:800 28px "Baloo 2", cursive; border:2px solid transparent; background:#25244a; color:#efe8ff; border-color:#3b3970}
    .tile[aria-current="true"]{background:#335c9e; color:#fff; box-shadow:inset 0 0 0 2px rgba(255,255,255,.06)}

    .cta{margin-top:20px; padding:14px 18px; border-radius:999px; border:0; font-weight:800; cursor:pointer; background:linear-gradient(180deg, #6bb8ff, #337dff); color:#fff; box-shadow:0 6px 16px rgba(107,184,255,.35)}

    .sticker-grid{margin-top:20px; display:grid; grid-template-columns:repeat(6, 1fr); gap:12px}
    .sticker{height:72px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-weight:800; background:#24233e; color:#bba9f0; border:2px dashed #3e3a73}

    .sky{position:absolute; inset:0; pointer-events:none}
    .glow{position:absolute; width:6px; height:6px; border-radius:50%; background:#fff; opacity:.6; filter:blur(1px); animation:glow 4s ease-in-out infinite}
    .glow:nth-child(2){left:40%; top:18%; animation-delay:.6s}
    .glow:nth-child(3){left:78%; top:26%; animation-delay:1s}
    .glow:nth-child(4){left:18%; top:40%; animation-delay:1.6s}
    @keyframes glow{0%,100%{transform:translateY(0); opacity:.5}50%{transform:translateY(-4px); opacity:.9}}
  </style>