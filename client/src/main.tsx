import { createRoot } from "react-dom/client";
import "./index.css";

// Simple diagnostic version
const DiagnosticApp = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#0079F2' }}>Korsify - Diagnostic Test</h1>
      <p>✅ React is loading successfully!</p>
      <p>✅ JavaScript is working</p>
      <p>✅ CSS is loading</p>
      <button onClick={() => alert('Button works!')}>Test Interaction</button>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<DiagnosticApp />);
