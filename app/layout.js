// app/layout.js
import "styles/global.css";

export default function RootLayout({ children }) {
  return (
    <html>
      <head />

      <body className="min-h-screen bg-slate-900">

        <main className="">
        {children}
        </main>
        
      </body>
    </html>
  );
}