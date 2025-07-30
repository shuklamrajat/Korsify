import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  Clock, 
  Settings, 
  AlertCircle,
  Brain,
  FileText,
  Sparkles,
  Shield,
  Rocket
} from "lucide-react";

interface PhaseInfo {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface ProgressIndicatorProps {
  title: string;
  progress: number;
  status: 'processing' | 'completed' | 'failed';
  description?: string;
  phases?: PhaseInfo[];
  className?: string;
}

const phaseIcons = {
  'Document Analysis': FileText,
  'Content Analysis': Brain,
  'Content Generation': Sparkles,
  'Validation': Shield,
  'Finalization': Rocket,
};

const getPhaseIcon = (phaseName: string) => {
  const Icon = phaseIcons[phaseName as keyof typeof phaseIcons] || Settings;
  return Icon;
};

export default function ProgressIndicator({
  title,
  progress,
  status,
  description,
  phases = [],
  className,
}: ProgressIndicatorProps) {
  const getStatusColor = (phaseStatus: string) => {
    switch (phaseStatus) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (phaseStatus: string) => {
    switch (phaseStatus) {
      case 'completed':
        return CheckCircle;
      case 'processing':
        return Settings;
      case 'failed':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const formatPhaseName = (name: string) => {
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge 
            variant="outline" 
            className={cn(
              status === 'completed' ? 'border-green-200 text-green-700 bg-green-50' :
              status === 'processing' ? 'border-blue-200 text-blue-700 bg-blue-50' :
              'border-red-200 text-red-700 bg-red-50'
            )}
          >
            {status === 'processing' && <Settings className="w-3 h-3 mr-1 animate-spin" />}
            {status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
            {status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Overall Progress</span>
            <span className="text-gray-600">{progress}%</span>
          </div>
          <Progress 
            value={progress} 
            className={cn(
              "h-3",
              status === 'completed' ? "bg-green-100" :
              status === 'processing' ? "bg-blue-100" :
              "bg-red-100"
            )} 
          />
        </div>

        {/* Phase Details */}
        {phases.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Processing Phases</h4>
            <div className="space-y-2">
              {phases.map((phase, index) => {
                const PhaseIcon = getPhaseIcon(formatPhaseName(phase.name));
                const StatusIcon = getStatusIcon(phase.status);
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      getStatusColor(phase.status)
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <PhaseIcon className="w-4 h-4" />
                        <StatusIcon 
                          className={cn(
                            "w-4 h-4",
                            phase.status === 'processing' && "animate-spin"
                          )} 
                        />
                      </div>
                      <span className="font-medium">
                        {formatPhaseName(phase.name)}
                      </span>
                    </div>
                    
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs",
                        phase.status === 'completed' ? 'bg-green-100 text-green-800' :
                        phase.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        phase.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      )}
                    >
                      {phase.status === 'completed' ? 'Complete' :
                       phase.status === 'processing' ? 'In Progress' :
                       phase.status === 'failed' ? 'Failed' :
                       'Pending'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Enhancement Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">AI Enhancement</span>
          </div>
          <p className="text-sm text-blue-700">
            Powered by Google Gemini 2.5 Flash with expert-level pedagogical design and 
            cross-disciplinary content optimization.
          </p>
        </div>

        {/* Estimated Time */}
        {status === 'processing' && (
          <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Estimated completion</span>
            </div>
            <span className="font-medium">2-5 minutes</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
