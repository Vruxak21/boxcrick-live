import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateMatch from "./pages/CreateMatch";
import Toss from "./pages/Toss";
import TeamSetup from "./pages/TeamSetup";
import UmpireScoring from "./pages/UmpireScoring";
import ViewerScoreboard from "./pages/ViewerScoreboard";
import MatchResult from "./pages/MatchResult";
import InningsBreak from "./pages/InningsBreak";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create" element={<CreateMatch />} />
          <Route path="/match/:matchId/toss" element={<Toss />} />
          <Route path="/match/:matchId/setup" element={<TeamSetup />} />
          <Route path="/match/:matchId/umpire" element={<UmpireScoring />} />
          <Route path="/match/:matchId/view" element={<ViewerScoreboard />} />
          <Route path="/match/:matchId/result" element={<MatchResult />} />
          <Route path="/match/:matchId/innings-break" element={<InningsBreak />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
