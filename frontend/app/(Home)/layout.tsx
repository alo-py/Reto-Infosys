import Navbar from "@/app/ui/Components/Home/Navbar";

export default function HomeLayout({ children }: LayoutProps<"/">) {
    return (
        <div className="flex flex-col min-h-full">
            <Navbar />
            {children}
        </div>
    );
}
