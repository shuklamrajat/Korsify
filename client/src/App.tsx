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
import LoginPage from "@/pages/login";
import RoleSelection from "@/pages/role-selection";
import CreatorProfile from "@/pages/creator-profile";
import CreatorAnalytics from "@/pages/creator-analytics";
import CreatorSettings from "@/pages/creator-settings";
import CreatorHelp from "@/pages/creator-help";
import LearnerAnalytics from "@/pages/learner-analytics";
import LearnerProfile from "@/pages/learner-profile";
import LearnerSettings from "@/pages/learner-settings";
import LearnerHelp from "@/pages/learner-help";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={LoginPage} />
      <Route path="/select-role" component={RoleSelection} />
      <Route path="/creator" component={CreatorDashboard} />
      <Route path="/creator/profile" component={CreatorProfile} />
      <Route path="/creator/analytics" component={CreatorAnalytics} />
      <Route path="/creator/settings" component={CreatorSettings} />
      <Route path="/creator/help" component={CreatorHelp} />
      <Route path="/learner" component={LearnerDashboard} />
      <Route path="/learner/analytics" component={LearnerAnalytics} />
      <Route path="/learner/profile" component={LearnerProfile} />
      <Route path="/learner/settings" component={LearnerSettings} />
      <Route path="/learner/help" component={LearnerHelp} />
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
