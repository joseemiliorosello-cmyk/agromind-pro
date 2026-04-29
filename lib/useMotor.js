"use client";

// ═══════════════════════════════════════════════════════════════════
// lib/useMotor.js — Hook React para el motor de cálculo
// Aislado aquí para que motor.js no dependa de React.
// ═══════════════════════════════════════════════════════════════════

import React from "react";
import { correrMotor } from "./motor";

/**
 * Hook que ejecuta correrMotor de forma memoizada.
 * Retorna null si faltan los datos mínimos (vacasN, biotipo).
 */
export function useMotor(form, sat, potreros, usaPotreros) {
  return React.useMemo(() => {
    if (!form.vacasN || !form.biotipo) return null;
    try {
      return correrMotor(form, sat, potreros, usaPotreros);
    } catch(e) {
      console.error("Motor error:", e?.message || e, e?.stack?.split("\n")[1]);
      return null;
    }
  }, [form, sat, potreros, usaPotreros]);
}
