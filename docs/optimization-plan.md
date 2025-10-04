# Optimization & Improvement Plan

## Overview
This document tracks the incremental optimization plan and milestone outcomes for the ongoing refactor effort.

## Plan (2025-??)
- [x] **Gracefully handle absent `customRules` payloads**
  - Normalize incoming payloads in the worker entry point.
  - Harden rule generation helpers against non-array inputs.
  - Backfill coverage to prevent regressions.
- [x] **Support retrieving saved base configs**
  - Extend `/config` route with GET support and structured responses.
  - Align front-end data loading with the new API.
  - Cover load/save flows with automated tests.
- [x] **Avoid mutating the shared Sing-Box base config**
  - Ensure per-request cloning before localization adjustments.
  - Confirm isolated language-specific behavior through tests.

## Milestone Log
- **2025-10-04**: Completed the `customRules` hardening work. Incoming payloads are normalized, rule factories are defensive against malformed data, and regression coverage now ensures `/singbox` handles omitted `customRules` gracefully.
- **2025-10-05**: Delivered GET support for `/config`, returning normalized JSON payloads and covering the retrieval flow with vitest to guard against regressions.
- **2025-10-05**: Updated the Sing-Box builder to clone the base template prior to localization so per-request language changes remain isolated, with regression coverage ensuring the shared constant stays pristine.
