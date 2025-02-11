// src/components/CustomTitleBar.tsx
'use client';
import React from 'react';
import styles from './CustomTitleBar.module.css';

const CustomTitleBar: React.FC = () => {
  const minimize = () => window.electronAPI?.minimize();
  const maximize = () => window.electronAPI?.maximize();
  const close = () => window.electronAPI?.close();

  return (
    <div className={styles.titleBar}>
      <div className={styles.title}>AQoO</div>
      <div className={styles.controls}>
        <button onClick={minimize}>─</button>
        <button onClick={maximize}>□</button>
        <button onClick={close}>×</button>
      </div>
    </div>
  );
};

export default CustomTitleBar;
