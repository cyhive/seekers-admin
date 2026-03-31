export const showToast = {
  success: (message: string) => {
    // Simple console log for now, can be replaced with a custom toast implementation
    console.log(`✅ ${message}`);
  },
  error: (message: string) => {
    console.error(`❌ ${message}`);
  },
  loading: (message: string) => {
    console.log(`⏳ ${message}`);
  },
  dismiss: (toastId?: string) => {
    // No-op for now
  },
};
