
export default function HomeLayout({ children }: LayoutProps<"/">) {
    return (
        <div className="flex flex-col min-h-full">
            {children}
        </div>
    );
}
