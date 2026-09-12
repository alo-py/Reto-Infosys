import OptiGoLogo from "@/public/Assets/OptiGo_Logo.png"

export default function Navbar() {
    return (
        <nav className="flex items-center justify-between p-20">
            {/* OptiGo Logo */}
            <div className="text-3xl font-bold text-emerald-500">
                <img src={OptiGoLogo.src} alt="OptiGo Logo" className="h-30 w-auto" />
            </div>

            <div className="flex flex-col items-center justify-between p-20">
                <label htmlFor="search" className="text-lg font-semibold text-gray-700">
                    Search:
                </label>
                <input
                    type="text"
                    id="search"
                    name="search"
                    placeholder="Search..."
                    className="mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
            </div>
        </nav>
    );
}