import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import CreatorDashboard from "@/pages/creator-dashboard";
import LearnerDashboard from "@/pages/learner-dashboard";
import CourseEditor from "@/pages/course-editor";
import CourseViewer from "@/pages/course-viewer";
import AnalyticsDashboard from "@/pages/analytics-dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/creator" component={CreatorDashboard} />
      <Route path="/learner" component={LearnerDashboard} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route path="/courses/:id/edit" component={CourseEditor} />
      <Route path="/courses/:id" component={CourseViewer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
