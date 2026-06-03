import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <Navbar />
      <main
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "18px clamp(12px, 2vw, 28px)",
          width: "100%",
        }}
      >
        {children}
      </main>
    </div>
  );
}
