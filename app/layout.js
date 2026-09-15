import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Nova Reach — Autonomous search visibility",
  description:
    "Nova Reach turns your knowledge base into an autonomous chat agent that answers visitor questions on Google and AI answer engines, day and night.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
