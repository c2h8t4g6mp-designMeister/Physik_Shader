"use client"

import dynamic from "next/dynamic"
import styles from "../playground.module.css"

const SolarSystem = dynamic(() => import("./SolarSystem"), {
  ssr: false,
  loading: () => <span className={styles.placeholder}>Physik lädt…</span>,
})

export default SolarSystem
