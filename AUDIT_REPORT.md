# KERNEL//LAB — Comprehensive System Audit, Algorithmic Verification & Validation Report

**System Name:** KERNEL//LAB (Interactive Operating Systems Simulator)  
**Version:** 1.0.0 Production  
**Deployment Environment:** Next.js 14 (App Router) + TypeScript + GitHub Pages Static Export  
**Live Production URL:** [https://rohithseervi77.github.io/OS-project/](https://rohithseervi77.github.io/OS-project/)  
**Test Suite Status:** 30/30 Master Tests & Invariant Checks Passing (100% Success)  

---

## 1. Executive Summary

KERNEL//LAB is an interactive Operating Systems CPU scheduling research simulator designed to emulate real-world kernel dispatching, multi-level queue mechanics, discrete-event simulation, historical burst estimation, and multi-objective optimization.

A comprehensive end-to-end audit was conducted across the codebase to identify mathematical errors, routing defects, state management divergences, validation gaps, and user interface inconsistencies. All detected discrepancies were resolved while strictly preserving backend logic, simulation fidelity, and algorithmic integrity.

---

## 2. Key Defect Fixes & Algorithmic Corrections

### 2.1. Routing & GitHub Pages Navigation Integrity (Phase 1)
- **Defect Identified:** Static Next.js exports without trailing slashes cause 404 errors on GitHub Pages when a user refreshes or navigates directly to subroutes (e.g. `/scheduler`).
- **Remediation:** Configured `trailingSlash: true` in `next.config.mjs` for static export builds. Each route generates a folder containing an `index.html` file (e.g. `out/scheduler/index.html`), ensuring browser refreshes, direct bookmarks, and forward/back navigation function flawlessly.
- **Canonical Navigation Standard:** Unified navigation bar across all routes (`CONTROL ROOM`, `PROCESS MONITOR`, `BURST LAB`, `BENCHMARKS`, `ALGORITHM LAB`, `RESEARCH MODE`, `SETTINGS`) with real-time status indicator (`● SYSTEM ONLINE`).

### 2.2. Single Source of Truth via SimulationContext (Phase 2 & 19)
- **Defect Identified:** Fragmentation of process state between `/scheduler`, `/processes`, `/analytics`, and `/settings`. Modifying a process in Process Monitor previously did not immediately reflect inside the active Control Room simulation.
- **Remediation:** Architected `src/context/SimulationContext.tsx` as the single authoritative simulation provider wrapped around `RootLayout`. All pages now share identical process runqueues, workload characteristics, objective scoring weights, aging thresholds, and simulation step state.

### 2.3. SRTF Preemption & Arrival Sorting Bug (Phase 3 & 4)
- **Defect Identified:** In `src/lib/scheduler/srtf.ts`, unarrived processes were un-sorted by arrival time in preemption lookaheads, which could allow later-arriving tasks to be evaluated before earlier arrivals.
- **Remediation:** Enforced strict sorting of future arrivals: `unarrived.sort((a, b) => a.arrivalTime - b.arrivalTime)`. Preemption now accurately evaluates the earliest arrival point and calculates correct remaining bursts.

### 2.4. Native Multi-Level Feedback Queue (MLFQ) Simulation Stepping (Phase 5)
- **Defect Identified:** `DiscreteEventSimulationEngine` previously collapsed MLFQ into basic Round-Robin when executed interactively step-by-step in Control Room.
- **Remediation:** Integrated native multi-level queues ($Q_0$, $Q_1$, $Q_2$) directly into `DiscreteEventSimulationEngine`. $Q_0$ operates with $q=2\text{ms}$, demoting uncompleted tasks to $Q_1$ ($q=4\text{ms}$), which further demote to $Q_2$ (FCFS). Implemented starvation prevention priority boost promoting all waiting processes in $Q_1$ and $Q_2$ back to $Q_0$ every $25\text{ms}$.

### 2.5. Removal of Artificial Algorithm Bias (Phase 10 & 11)
- **Defect Identified:** An artificial $1.05\times$ multiplier was applied to SRTF in `smartScheduler.ts` under high-confidence workloads, artificially inflating SRTF utility scores and biasing policy selection.
- **Remediation:** Removed the arbitrary $1.05\times$ boost. Smart Scheduler selection is now strictly determined by the normalized multi-objective utility function across waiting time, turnaround time, response time, CPU utilization, Jain's fairness index, and context switch penalties.

### 2.6. Objective Weight Validation & Enforcement (Phase 11)
- **Defect Identified:** Settings page previously permitted committing objective weights that did not sum to $100\%$, skewing utility calculations.
- **Remediation:** Implemented strict total weight validation:
  $$\sum w_i = 100\%$$
  If $\sum w_i \ne 100\%$, an `INVALID CONFIGURATION` banner appears, commit is disabled, and a one-click `AUTO-NORMALIZE (100%)` action scales all weights proportionally to achieve exact unity.

### 2.7. Prediction Engine Validation & Division by Zero Guard (Phase 12)
- **Defect Identified:** Arbitrary user testbench inputs could contain non-positive or non-numeric tokens, risking mathematical anomalies or division by zero.
- **Remediation:** Added validation rejecting bursts $\le 0$ and non-numeric inputs. Guarded `calculateError` against zero actual bursts. Updated terminology to academic standards:
  - *"Confidence"* $\to$ **Prediction Reliability Score** ($\max(0, 100 - \text{Error})\%$)
  - *"Regression Analysis"* $\to$ **Historical Burst Sequence Analysis**

---

## 3. Mathematical Invariant Verification Matrix

| Invariant | Mathematical Formula | Test Condition | Status |
| :--- | :--- | :--- | :--- |
| **Turnaround Time** | $TAT = CT - AT$ | Evaluated across all 6 algorithms for all processes | **VERIFIED** |
| **Waiting Time** | $WT = TAT - BT \ge 0$ | Verified strictly non-negative across all algorithms | **VERIFIED** |
| **Response Time** | $RT = \text{FirstScheduled} - AT \ge 0$ | Verified strictly non-negative across all algorithms | **VERIFIED** |
| **Jain's Fairness** | $J = \frac{(\sum x_i)^2}{n \sum x_i^2} \in [1/n, 1.0]$ | Bounded in $[\frac{1}{n}, 1.0]$ for identical and skewed workloads | **VERIFIED** |
| **Prediction Recursion** | $\tau(n+1) = \alpha t(n) + (1-\alpha)\tau(n)$ | Exponential smoothing recursion exact to 2 decimal places | **VERIFIED** |
| **Zero Division Safety** | $t(n) \le 0 \implies \text{Error} = 0$ | Evaluated with zero-burst inputs; no crashes or NaN values | **VERIFIED** |

---

## 4. Test Suite Summary

The automated test suite (`npm test`) executes 30 unit tests and invariant verification checks across 6 phases:

```
========================================================
  ALL TEST PHASES & AUDIT INVARIANTS PASSED! (30/30)    
========================================================
- Phase 1: Process Generator Batch Sizes, Deterministic Seeds, PCB State Transitions (7/7)
- Phase 2: Classical Scheduling Algorithms (FCFS, SJF, SRTF, RR, Priority + Aging) (5/5)
- Phase 3: Discrete-Event Engine Execution, Jain Fairness, Gantt Segment Compression (3/3)
- Phase 4: Exponential Averaging, Alpha Sensitivity, Prediction Volatility (4/4)
- Phase 5: Workload Analyzer, Dynamic Quantum, Smart Multi-Objective Scheduler, MLFQ (5/5)
- Phase 6: Fundamental OS Accounting Invariants, Bounds, Zero-Division Safety (6/6)
```

---

## 5. Deployment & Production Verification

- **Static Pages Build:** Prerendered 12 static HTML routes (`npm run build:pages`).
- **Asset Integrity:** `.nojekyll` committed to disable GitHub Pages asset suppression.
- **Direct Link Support:** Tested and verified with trailing slash resolution for all paths.
