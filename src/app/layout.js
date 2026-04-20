import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import ConditionalNavbar from "./components/ConditionalNavbar";
import Footer from "./components/Footer";
import { CartProvider } from "./context/CartContext";
import ReactQueryProvider from "./components/ReactQueryProvider";

// Body font
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Mono font
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Luxury heading font
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "VELRA | Modern Luxury Clothing Brand",
    template: "%s | VELRA",
  },
  description:
    "VELRA is a modern luxury clothing brand offering premium fashion pieces designed for style, comfort, and confidence.",
  keywords: [
    "fashion",
    "luxury clothing",
    "streetwear",
    "modern fashion",
    "VELRA",
    "mens clothing",
    "womens fashion",
  ],
  authors: [{ name: "VELRA" }],
  creator: "VELRA",
  openGraph: {
    title: "VELRA | Modern Luxury Clothing Brand",
    description:
      "Discover premium fashion pieces designed for modern lifestyle and confidence.",
    url: "https://your-domain.com",
    siteName: "VELRA",
    images: [
      {
        url: "/model6.jpg",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VELRA | Modern Luxury Clothing Brand",
    description:
      "Discover premium fashion pieces designed for modern lifestyle and confidence.",
    images: ["/model6.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">

        <ReactQueryProvider>
          <CartProvider>

            <ConditionalNavbar />

            <main className="flex-1">
              {children}
            </main>

            <Footer />

          </CartProvider>
        </ReactQueryProvider>

      </body>
    </html>
  );
}