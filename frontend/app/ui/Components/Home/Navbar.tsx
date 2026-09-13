import Image from 'next/image';
import Link from 'next/link';
import { User, Navigation } from 'lucide-react';
import OptiGoLogo from '@/public/Assets/OptiGo_Logo.png';

export default function Navbar() {
    return (
        <nav className="bg-linear-to-r from-gray-200/30 to-emerald-200/30 backdrop-blur-lg p-4 border border-white/30 rounded-b-4xl shadow-md">
            <div className="container mx-auto">
                <div className="flex items-center justify-between">
                    <Link href="/" className="text-white font-bold text-xl flex items-center hover:opacity-90 transition-opacity">
                        <Image src={OptiGoLogo} alt="OptiGo Logo" className="inline-block h-8 w-8 mr-2" priority />
                        OptiGo
                    </Link>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <Link href="/" className="text-white hover:bg-slate-200/30 hover:text-gray-800 p-2 rounded-lg text-sm font-medium">Home</Link>
                        <Link href="/driver" className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs md:text-sm flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02]">
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Driver App</span>
                        </Link>
                        <div className="flex items-center">
                            <Link href="/login">
                                <User className="text-white hover:bg-slate-200/30 hover:text-gray-800 p-2 rounded-lg cursor-pointer" size={42} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}