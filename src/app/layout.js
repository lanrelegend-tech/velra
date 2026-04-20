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
  title: "VELRA",
  description: "Modern clothing brand",
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