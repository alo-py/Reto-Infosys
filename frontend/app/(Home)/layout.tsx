import Navbar from "@/app/ui/Components/Home/Navbar";

export default function HomeLayout({
    children,
}: { 
    children: React.ReactNode; 
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            {children}
        </div>
    );
}