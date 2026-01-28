import { type FC } from "react";

export const LoadingScreen: FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center p-6 md:p-12 space-y-8 bg-card border rounded-xl shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <img
            src="/DigiCartBW.svg"
            alt="DigiCart Logo"
            className="w-48 h-48 object-contain animate-pulse"
          />
        </div>
        <div className="space-y-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">DigiCart</h2>
          <p className="text-lg text-muted-foreground animate-pulse">
            Wird geladen...
          </p>
        </div>
      </div>
    </div>
  );
};
