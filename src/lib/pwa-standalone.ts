// Standalone file demo: service workers need an HTTP origin, so registration is disabled.
export function useRegisterSW() {
  const noChange = () => {};
  return {
    needRefresh: [false, noChange] as const,
    offlineReady: [false, noChange] as const,
    updateServiceWorker: async (_reload?: boolean) => {}
  };
}
