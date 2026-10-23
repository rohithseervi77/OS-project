import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/layout/Navbar';
import { SimulationProvider } from '../context/SimulationContext';

export const metadata: Metadata = {
  title: 'KERNEL//LAB — Interactive Operating Systems Simulator',
  description: 'Workload-Aware Adaptive CPU Scheduling Using Predictive Analytics & Discrete-Event Simulation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0c10] text-[#e6e8ec] antialiased selection:bg-amber-500/20 selection:text-amber-300">
        <SimulationProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-3.5rem)]">
            {children}
          </main>
        </SimulationProvider>
      </body>
    </html>
  );
}
