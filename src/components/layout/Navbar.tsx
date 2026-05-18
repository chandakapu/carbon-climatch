import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-white font-semibold text-lg">
                🌱 carbon-climatch
            </Link>
            <div className="flex gap-6 text-sm text-slate-300">
                <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
                <Link href="/calculator" className="hover:text-white transition-colors">CBAM Calculator</Link>
                <Link href="/timeline" className="hover:text-white transition-colors">Regulatory Timeline</Link>
            </div>
        </nav>
    );
}