"use client"

import { useState } from "react";
import styles from "./playground.module.css";
import ShaderDemoLoader from "./components/ShaderDemoLoader";
import SolarSystemLoader from "./components/SolarSystemLoader";

type Tab = "shader" | "physik"

export default function PlaygroundPage() {
  // Nur ein Modul ist gleichzeitig aktiv – das andere wird vollständig ausgehängt
  const [tab, setTab] = useState<Tab>("shader")

  return (
    <>
      {/* Shader-Hintergrund — nur gemountet wenn "shader"-Tab aktiv */}
      {tab === "shader" && (
        <div className={styles.shaderBg}>
          <ShaderDemoLoader />
        </div>
      )}

      <main className={styles.main}>
        <header className={styles.header}>
          <span className={styles.label}>Tech-Component Collection</span>
          <h1 className={styles.title}>Playground</h1>

          {/* Tab-Umschalter */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === "shader" ? styles.tabActive : ""}`}
              onClick={() => setTab("shader")}
            >
              Shader
            </button>
            <button
              className={`${styles.tab} ${tab === "physik" ? styles.tabActive : ""}`}
              onClick={() => setTab("physik")}
            >
              Physik
            </button>
          </div>
        </header>

        {/* Physik-Modul — nur gemountet wenn "physik"-Tab aktiv */}
        {tab === "physik" && (
          <section className={styles.module}>
            <div className={styles.moduleHeader}>
              <span className={styles.moduleNumber}>02</span>
              <div>
                <h2 className={styles.moduleName}>Physik</h2>
                <p className={styles.moduleDesc}>
                  Interaktives Sonnensystem — Rapier-Physik
                </p>
              </div>
            </div>
            <SolarSystemLoader />
          </section>
        )}
      </main>
    </>
  );
}
