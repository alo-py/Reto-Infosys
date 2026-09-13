import Image from 'next/image';
import { User } from 'lucide-react';
import OptiGoLogo from '@/public/Assets/OptiGo_Logo.png';

export default function Navbar() {
    return (
        <nav className="bg-linear-to-r from-gray-200/30 to-emerald-200/30 backdrop-blur-lg p-4 border border-white/30 rounded-b-4xl shadow-md">
            <div className="container mx-auto">
                <div className="flex items-center justify-between">
                    <div className="text-white font-bold text-xl flex items-center">
                        <Image src={OptiGoLogo} alt="OptiGo Logo" className="inline-block h-8 w-8 mr-2" priority />
                        OptiGo
                    </div>
                    <div className="hidden md:flex space-x-4">
                        <a href="#" className="text-white hover:bg-slate-200/30 hover:text-gray-800 p-2 rounded-lg">Home</a>
                        <a href="#" className="text-white hover:bg-slate-200/30 hover:text-gray-800 p-2 rounded-lg">About</a>
                        <a href="#" className="text-white hover:bg-slate-200/30 hover:text-gray-800 p-2 rounded-lg">Plans</a>
                        <div className="flex items-center">
                            <User className="text-white hover:bg-slate-200/30 hover:text-gray-800 p-2 rounded-lg" size={42} />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}