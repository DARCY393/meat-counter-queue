import Link from "next/link";

const links = [
  {
    href: "/kiosk",
    title: "Kiosk",
    desc: "Customer walk-up: enter name, get a ticket number",
    color: "from-amber-500 to-orange-600",
  },
  {
    href: "/board",
    title: "Customer Board",
    desc: "TV signage: NOW SERVING + UP NEXT (live SSE)",
    color: "from-emerald-500 to-teal-600",
  },
  {
    href: "/counter",
    title: "Counter",
    desc: "Staff view with huge NEXT button",
    color: "from-rose-500 to-red-600",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <p className="text-amber-400 font-semibold tracking-widest uppercase text-sm mb-3">
          Meat Counter Queue
        </p>
        <h1 className="text-4xl md:text-5xl font-black mb-4">
          Walk-up ticketing MVP
        </h1>
        <p className="text-slate-300 text-lg mb-10 max-w-2xl">
          Open each view in its own browser window on the local network. No
          accounts — designed for an on-site PC behind the counter.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl bg-gradient-to-br ${link.color} p-6 shadow-lg hover:scale-[1.02] transition-transform`}
            >
              <h2 className="text-2xl font-bold mb-2">{link.title}</h2>
              <p className="text-white/90 text-sm leading-relaxed">{link.desc}</p>
              <p className="mt-4 font-mono text-sm opacity-80">{link.href}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
