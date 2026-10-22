# KERNEL//LAB — Interactive Operating Systems Simulator
> **Workload-Aware Adaptive CPU Scheduling Using Predictive Analytics & Discrete-Event Simulation**

![Kernel Lab Telemetry](https://img.shields.io/badge/System-Online-emerald?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-Dark_Graphite-amber?style=for-the-badge&logo=tailwindcss)
![Tests](https://img.shields.io/badge/Unit_Tests-24%2F24_Passed-success?style=for-the-badge)

---

## Overview

**KERNEL//LAB** is an engineering-grade Operating Systems CPU scheduling simulator. Unlike static educational demos, every decision, prediction, Gantt segment, and performance metric is computed from an active, deterministic discrete-event simulation engine with zero hardcoded results.

The system addresses the fundamental dilemma of operating system scheduling: **choosing the right algorithm and time quantum for dynamically shifting workloads**. By pairing Exponential Averaging burst prediction with a multi-objective utility scoring engine, KERNEL//LAB autonomously evaluates candidate scheduling policies on identical workload snapshots, dynamically calibrates time quantums, and provides an explainable decision trace.

```
Process Generator ──► PCB Manager ──► Burst Predictor ──► Workload Analyzer ──► Smart Scheduler ──► CPU Dispatcher ──► Telemetry Dashboard
```

---

## Key Subsystems

### 1. CPU Control Room (`/scheduler`)
- **Processor Core 0 Monitor**: Real-time core utilization bar with ASCII telemetry (`██████████████░░ 78%`), current PID, and remaining burst.
- **CPU Execution Timeline (Gantt Chart)**: Millisecond-accurate execution ruler with consecutive slice merging, context switch markers, and a live vertical time cursor.
- **Ready Queue**: Visual node sequence (`[P02] → [P04] → [P09] → [P11]`) showing PID, priority, and predicted burst length. Clicking any process opens its PCB inspector.
- **System Event Stream**: Monospace terminal logging arrivals, dispatches, preemptions, quantum expirations, and completions.
- **Interactive Controls**: `START`, `PAUSE`, `STEP (1ms)`, `RESET`, and speed scaling (`0.5x`, `1x`, `2x`, `5x`).

### 2. Burst Predictor (`/predictions`)
- **Exponential Smoothing Model**:
  $$\tau(n+1) = \alpha \cdot t(n) + (1 - \alpha) \cdot \tau(n)$$
  Configurable $\alpha \in \{0.1, 0.2, 0.3, 0.5, 0.7, 0.9\}$ (default $\alpha = 0.5$).
- **Statistical Error & Confidence**:
  $$\text{Error} = \frac{|\text{actual} - \text{predicted}|}{\text{actual}} \times 100$$
  $$\text{Confidence} = \max(0, 100 - \text{Error})$$
  Classified as `HIGH` ($\ge 80\%$), `MEDIUM` ($50\% - 79\%$), or `LOW` ($< 50\%$).
- **Modular Architecture**: Pluggable interface (`BurstPredictor`) supporting Exponential Averaging, Linear Trend Regression, and future ML ensembles.

### 3. Classical Scheduling Engine
All classical algorithms run on the **identical process dataset snapshot**:
- **FCFS** (First-Come, First-Served) — Non-preemptive FIFO dispatch.
- **SJF** (Shortest Job First) — Non-preemptive shortest burst first using predicted or actual burst times.
- **SRTF** (Shortest Remaining Time First) — Preemptive SJF with preemption logging.
- **Round Robin (RR)** — Cyclic time-sharing with user-selectable ($q \in \{2, 4, 6, 8, 10\}\text{ms}$) or dynamic quantum.
- **Priority Scheduling** — Preemptive priority with active Starvation Aging (gradually elevates priority when wait exceeds threshold).
- **MLFQ** (Multilevel Feedback Queue) — 3-tier queue structure ($Q_0\text{ RR }q=2\text{ms} \to Q_1\text{ RR }q=4\text{ms} \to Q_2\text{ FCFS}$) with quantum demotion and periodic priority boost resets.

### 4. Smart Decision Engine
- **Workload Classification**: Classifies workloads as `CPU-HEAVY`, `I/O-HEAVY`, `INTERACTIVE`, `MIXED`, `BURSTY`, `HIGH-PRIORITY`, or `STARVATION-RISK`.
- **Dynamic Quantum**: Computes optimal slice $q \in [2\text{ms} \dots 12\text{ms}]$ considering burst variance, interactive ratio, and context-switch penalties.
- **Multi-Objective Utility Scoring**:
  $$\text{Score} = \sum w_i \cdot \text{NormalizedMetric}_i$$
  Weights: Waiting Time (25%), Response Time (20%), Turnaround Time (15%), CPU Utilization (15%), Jain's Fairness (15%), Context Switch Overhead (10%).
- **Confidence-Aware Fallback**: If prediction confidence drops below 50%, reliance on predicted bursts is automatically dialed back in favor of conservative, fair policies (RR/MLFQ) to prevent starvation.
- **Explainable Decision Trace**: Generates deterministic, condition-based reasoning explaining *why* the algorithm was selected.

### 5. Process Monitor (`/processes`)
- System process table with `PID`, `STATE`, `ARRIVAL`, `BURST`, `REMAINING`, `PRIORITY`, `PREDICTION`, `CONFIDENCE`, and `WAIT`.
- Process Control Block (PCB) inspector showing registers, state transition history (`NEW` $\to$ `READY` $\to$ `RUNNING` $\to$ `TERMINATED`), and burst progression.

### 6. Benchmark Workstation (`/analytics`)
- Matrix comparing all policies across Waiting Time, Response Time, Turnaround Time, CPU Utilization, Jain's Fairness, Context Switches, and Score.
- Side-by-side comparative diffs showing exact calculated percentage improvements over fixed Round Robin ($\downarrow \text{WT}\%$, $\downarrow \text{RT}\%$, $\uparrow \text{Fairness}\%$).

---

## Verification & Unit Testing

The repository includes a comprehensive 24-test master suite verifying all mathematical and operational logic against known textbook solutions:

```bash
npm test
```

| Suite | Modules Covered | Result |
| :--- | :--- | :--- |
| **Phase 1** | Batch sizing, Seed reproducibility, Scenario generation, PCB transitions, Aging, Exponential math | **7/7 PASSED** |
| **Phase 2** | FCFS textbook scenario, SJF ordering, SRTF preemption & resumption, Round Robin slicing, Priority aging | **5/5 PASSED** |
| **Phase 3** | Jain's Fairness Index, Discrete-event engine step execution, Gantt compression | **3/3 PASSED** |
| **Phase 4** | Burst Predictor mathematical precision, $\alpha$ smoothing sensitivity, Linear Regression placeholder, Volatility | **4/4 PASSED** |
| **Phase 5-7**| Workload Analyzer, Dynamic Quantum, Multi-objective scoring, Low-confidence fallback, MLFQ demotion & boost | **5/5 PASSED** |
| **Total** | **All Modules** | **24/24 PASSED** |

---

## Local Development

```bash
# Clone the repository
git clone https://github.com/rohithseervi77/OS-project.git
cd OS-project

# Install dependencies
npm install

# Run database synchronization
npx prisma db push

# Run the unit tests
npm test

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS (Dark Graphite / Warm Amber theme)
- **Icons**: Lucide React
- **Database**: SQLite & Prisma ORM
- **Engine**: Pure Discrete-Event Simulation & Mathematical Estimators (Zero external paid API dependencies)
