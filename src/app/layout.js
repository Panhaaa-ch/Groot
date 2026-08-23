import "./globals.css";
import ShellLayout from "@/components/ShellLayout";

export const metadata = {
  title: "Groot",
  description: "Your plant companion app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Quicksand:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-body-md text-body-md min-h-screen overflow-x-hidden relative">
        <ShellLayout>{children}</ShellLayout>
      </body>
    </html>
  );
}
