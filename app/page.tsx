import Link from "next/link";
import Workspace from "../components/workspace/Workspace";
import PlasmaWave from "../components/PlasmaWave";
import type { ComponentType, ReactNode } from "react";
import CardSwap, { Card as CardImpl } from "../components/CardSwap";
import FolderImpl from "../components/Folder";

// These reactbits components are authored in JS; their inferred prop types are too
// narrow (forwardRef drops props; `items = []` infers never[]), so we give them shapes.
const Card = CardImpl as unknown as ComponentType<{
  className?: string;
  children?: ReactNode;
}>;
const Folder = FolderImpl as unknown as ComponentType<{
  color?: string;
  size?: number;
  className?: string;
  items?: ReactNode[];
}>;

const FEATURES = [
  {
    emoji: "🧾",
    title: "Form → PDF",
    body: "Real vector text, not a screenshot.",
    bg: "bg-jasmine-100",
    ring: "text-jasmine-800",
    tilt: "-rotate-2",
  },
  {
    emoji: "🎨",
    title: "Three templates",
    body: "Minimal, Modern, Bold.",
    bg: "bg-lobster-100",
    ring: "text-lobster-700",
    tilt: "rotate-1",
  },
  {
    emoji: "💾",
    title: "Clients on-device",
    body: "Saved in your browser. Nothing to log into.",
    bg: "bg-willow-100",
    ring: "text-willow-800",
    tilt: "rotate-2",
  },
  {
    emoji: "✨",
    title: "Chat it into being",
    body: "Your key, any model, plain language.",
    bg: "bg-granite-100",
    ring: "text-granite-800",
    tilt: "-rotate-1",
  },
  {
    emoji: "🪄",
    title: "Nothing slips",
    body: "Missing a name? A popup catches it.",
    bg: "bg-bordeaux-100",
    ring: "text-bordeaux-700",
    tilt: "rotate-2",
  },
  {
    emoji: "📤",
    title: "CSV in & out",
    body: "Bring your list, take it with you.",
    bg: "bg-jasmine-100",
    ring: "text-jasmine-800",
    tilt: "-rotate-2",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-jasmine-50 text-bordeaux-950">
      {/* Hero */}
      <section className="relative flex min-h-[92vh] flex-col overflow-hidden bg-bordeaux-950 text-jasmine-50">
        {/* animated plasma background */}
        <PlasmaWave
          className="pointer-events-none absolute inset-0 h-full w-full"
          colors={["#ee115b", "#f4cf3e"]}
          speed1={0.05}
          speed2={0.05}
          focalLength={0.8}
          bend1={1}
          bend2={0.5}
          dir2={1}
          rotationDeg={0}
        />
        {/* darkening overlays for text contrast */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-bordeaux-950/90 via-bordeaux-950/50 to-bordeaux-950/20" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-bordeaux-950/70 via-transparent to-bordeaux-950/30" />

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-9 sm:px-10 sm:py-11">
          <span className="flex items-center gap-2.5 text-2xl font-black tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-jasmine-400 text-lg text-bordeaux-950">
              i
            </span>
            Invoicely
          </span>
          <Link
            href="#workspace"
            className="rounded-full bg-jasmine-400 px-6 py-3 text-sm font-bold text-bordeaux-950 shadow-lg shadow-bordeaux-950/30 transition hover:-translate-y-0.5 hover:bg-jasmine-300"
          >
            Open workspace →
          </Link>
        </header>

        <div className="relative mx-auto grid w-full max-w-6xl flex-1 content-center gap-12 px-6 pb-24 pt-4 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-jasmine-400/40 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-jasmine-200 backdrop-blur">
              No signup · No backend · Your data stays yours
            </span>
            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Invoices that
              <br />
              don&apos;t feel like{" "}
              <span className="bg-linear-to-r from-jasmine-300 to-willow-300 bg-clip-text text-transparent">
                paperwork.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-jasmine-100/80">
              Fill a form or just type a sentence. Get a beautiful PDF — right
              in your browser.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#workspace"
                className="rounded-full bg-jasmine-400 px-7 py-3.5 text-sm font-bold text-bordeaux-950 shadow-xl shadow-bordeaux-950/40 transition hover:-translate-y-0.5 hover:bg-jasmine-300"
              >
                Make an invoice
              </Link>
              <a
                href="#features"
                className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-jasmine-50 transition hover:bg-white/10"
              >
                See what it does
              </a>
            </div>
          </div>

          {/* Swapping invoice previews */}
          <div className="relative hidden h-110 w-full lg:block">
            <CardSwap
              width={340}
              height={430}
              cardDistance={52}
              verticalDistance={60}
              delay={3200}
              pauseOnHover
            >
              {/* Minimal */}
              <Card className="bg-white! border-black/10! overflow-hidden text-bordeaux-950 shadow-2xl shadow-black/40">
                <div className="flex items-start justify-between border-b-2 border-lobster-pink px-7 pb-5 pt-7">
                  <div>
                    <p className="text-lg font-black text-granite">
                      Studio Nova
                    </p>
                    <p className="text-xs text-granite-500">
                      hello@studionova.co
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black tracking-widest text-granite">
                      INVOICE
                    </p>
                    <p className="text-xs text-granite-500">INV-0142</p>
                  </div>
                </div>
                <div className="space-y-3 px-7 py-6 text-sm">
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-granite-700">Brand identity</span>
                    <span className="font-semibold">$2,400</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-granite-700">Landing page</span>
                    <span className="font-semibold">$1,150</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-bordeaux-950 pt-3 text-base font-black text-granite">
                    <span>Total</span>
                    <span>$3,550</span>
                  </div>
                </div>
              </Card>

              {/* Modern */}
              <Card className="bg-white! border-black/10! overflow-hidden text-bordeaux-950 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between bg-night-bordeaux px-7 py-6 text-jasmine">
                  <div>
                    <p className="text-base font-black text-white">
                      Pixel & Prose
                    </p>
                    <p className="text-[11px] text-jasmine-200">
                      studio@pixelprose.io
                    </p>
                  </div>
                  <p className="text-lg font-black tracking-[0.2em]">INVOICE</p>
                </div>
                <div className="space-y-3 px-7 py-6 text-sm">
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-granite-700">Illustration set</span>
                    <span className="font-semibold">$1,800</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-granite-700">Motion loop</span>
                    <span className="font-semibold">$900</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-willow-green px-4 py-3 font-black text-willow-950">
                    <span>Total</span>
                    <span>$2,700</span>
                  </div>
                </div>
              </Card>

              {/* Bold */}
              <Card className="bg-white! border-black/10! overflow-hidden text-bordeaux-950 shadow-2xl shadow-black/40">
                <div className="bg-lobster-pink px-7 pb-6 pt-7 text-white">
                  <p className="text-2xl font-black leading-none">
                    Ferns & Co.
                  </p>
                  <p className="mt-1 text-xs text-white/85">
                    billing@ferns.studio
                  </p>
                </div>
                <div className="flex justify-between bg-night-bordeaux px-7 py-2.5 text-[11px] font-bold uppercase tracking-wider text-jasmine">
                  <span>Invoice INV-0207</span>
                  <span>Due Jul 22</span>
                </div>
                <div className="space-y-3 px-7 py-6 text-sm">
                  <div className="flex justify-between border-b border-jasmine-200 pb-2">
                    <span className="text-granite-700">Consulting · 8h</span>
                    <span className="font-semibold">$1,600</span>
                  </div>
                  <div className="flex justify-between border-b border-jasmine-200 pb-2">
                    <span className="text-granite-700">Workshop</span>
                    <span className="font-semibold">$750</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between bg-night-bordeaux px-4 py-3 text-base font-black text-jasmine">
                    <span>Total</span>
                    <span>$2,350</span>
                  </div>
                </div>
              </Card>
            </CardSwap>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-10"
      >
        <h2 className="text-center text-3xl font-black tracking-tight text-bordeaux-950 sm:text-4xl">
          Everything you need.{" "}
          <span className="text-lobster-500">Nothing you don&apos;t.</span>
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`${f.bg} ${f.tilt} rounded-3xl p-6 shadow-sm transition hover:rotate-0 hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className="mb-3 text-3xl">{f.emoji}</div>
              <h3 className={`text-lg font-black ${f.ring}`}>{f.title}</h3>
              <p className="mt-1 text-sm font-medium text-granite-800">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Your files */}
      <section className="relative overflow-hidden bg-night-bordeaux px-6 py-24 sm:px-10">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-jasmine sm:text-4xl">
            Your files, tucked in a folder.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium text-jasmine-200/80">
            Every invoice you make or upload is kept right here on your device.
            Nothing saved yet — click the folder to peek inside.
          </p>

          <div className="mt-24 flex flex-col items-center gap-8">
            <Folder size={1.6} color="#c1666b" items={[]} />
            <div className="rounded-full border border-jasmine-400/30 bg-white/5 px-5 py-2">
              <p className="text-sm font-black text-jasmine-50">
                General · <span className="text-jasmine-300">0 files</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workspace */}
      <section id="workspace" className="relative px-4 pb-20 sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl font-black tracking-tight text-bordeaux-950 sm:text-4xl">
              Your turn <span className="text-willow-500">→</span>
            </h2>
            <p className="text-sm font-medium text-granite-700">
              Everything below runs locally. No account required.
            </p>
          </div>
          <div className="overflow-hidden rounded-[2rem] bg-linear-to-br from-bordeaux-900 via-lobster-700 to-jasmine-400 p-1.5 shadow-2xl shadow-bordeaux-950/20">
            <div className="overflow-hidden rounded-[1.6rem] bg-white">
              <Workspace />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-bordeaux-950/10 bg-jasmine-50 px-6 py-8 text-center text-xs font-medium text-granite-700 sm:px-10">
        Runs entirely in your browser. Your keys and clients never leave your
        device.
      </footer>
    </div>
  );
}
