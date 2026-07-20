import { Syne, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ErrorProvider } from "@/app/contexts/ErrorContext";
import ToastContainer from "@/app/components/ToastContainer";
import Providers from "@/app/contexts/Providers";
import HeaderConditional from "@/app/components/HeaderConditional";
import PageWrapper from "@/app/components/PageWrapper";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "DocuQuery — Pose des questions sur tes documents",
  description:
    "Uploade un PDF, pose ta question, obtiens une réponse précise avec les sources. DocuQuery analyse tes documents et répond avec les citations exactes.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      data-theme="dark"
      className={`${syne.variable} ${dmSans.variable} ${ibmPlexMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('dq-theme');
                  if (t === 'light' || t === 'dark') {
                    document.documentElement.setAttribute('data-theme', t);
                  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-dq-bg text-dq-text antialiased">
        <Providers>
          <ErrorProvider>
            <a href="#main-content" className="skip-link">
              Aller au contenu principal
            </a>
            <HeaderConditional />
            <main id="main-content" className="flex-1">
              <PageWrapper>{children}</PageWrapper>
            </main>
            <ToastContainer />
          </ErrorProvider>
        </Providers>
      </body>
    </html>
  );
}
