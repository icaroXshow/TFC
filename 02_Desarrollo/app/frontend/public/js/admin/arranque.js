  });

  logoutBtn?.addEventListener("click", (e) => {
    // Limpia token aunque navegue a público.
    const existing = loadAuth();
    const token = existing?.token;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }

    // Logout best-effort (token stateless)
    if (token) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  });

  window.addEventListener("beforeunload", () => {
    if (machinesPollInterval) {
      clearInterval(machinesPollInterval);
      machinesPollInterval = null;
    }
    if (iotPollInterval) {
      clearInterval(iotPollInterval);
      iotPollInterval = null;
    }
  });

  init();
})();
