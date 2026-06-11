"use client"

import dynamic from "next/dynamic"
import styles from "../playground.module.css"

const ShaderDemo = dynamic(() => import("./ShaderDemo"), {
  ssr: false,
  loading: () => <span className={styles.placeholder}>Shader lädt…</span>,
})

export default ShaderDemo
