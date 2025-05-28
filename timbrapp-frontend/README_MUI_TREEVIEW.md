# Dipendenze MUI per la sidebar TreeView

Per garantire la compatibilità e la stabilità della sidebar ad albero (TreeView) nella dashboard, è necessario utilizzare le seguenti versioni dei pacchetti MUI:

- @mui/material@5.15.17
- @mui/lab@5.0.0-alpha.125

**Motivazione:**
Le versioni più recenti di @mui/lab e @mui/material (6.x/7.x) non sono compatibili con la toolchain attuale e la TreeView stabile è disponibile solo in queste versioni specifiche. L'uso di altre versioni può causare errori di build, warning o la scomparsa della sidebar.

**Come reinstallare le versioni corrette:**

```powershell
npm uninstall @mui/lab @mui/material
npm install @mui/material@5.15.17 @mui/lab@5.0.0-alpha.125 --legacy-peer-deps
```

**Nota:**
Non aggiornare questi pacchetti senza prima verificare la compatibilità della TreeView e della dashboard.

Ultimo aggiornamento: 13/05/2025
