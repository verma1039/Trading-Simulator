import AppRouter from "@/router";
import AppErrorBoundary from "@/components/common/AppErrorBoundary";
import { ToastProvider } from "@/components/feedback/ToastProvider";
import { AuthProvider } from "@/context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppErrorBoundary>
          <AppRouter />
        </AppErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
}
