import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/app/context/LanguageContext";

export const metadata: Metadata = {
    title: "OptiGo - Make your travel smarter",
    description: "OptiGo is a travel optimization platform that helps you plan your trips efficiently and cost-effectively. Discover the best routes, transportation options, and travel tips to make your journey smoother and more enjoyable.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="es"
            className="h-full antialiased"
        >
            <body className="min-h-full flex flex-col">
                <LanguageProvider>
                    {children}
                </LanguageProvider>
            </body>
        </html>
    );
}
