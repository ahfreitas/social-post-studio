import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, BarChart3 } from 'lucide-react';
import type { PostScore as PostScoreType } from '@/types/post';

interface ScoreCriteria {
  label: string;
  key: 'clarity' | 'engagement' | 'authenticity' | 'provocation';
  suggestionKey: 'claritySuggestion' | 'engagementSuggestion' | 'authenticitySuggestion' | 'provocationSuggestion';
  emoji: string;
}

const CRITERIA: ScoreCriteria[] = [
  { label: 'Clareza', key: 'clarity', suggestionKey: 'claritySuggestion', emoji: '🎯' },
  { label: 'Engajamento', key: 'engagement', suggestionKey: 'engagementSuggestion', emoji: '🔥' },
  { label: 'Autenticidade', key: 'authenticity', suggestionKey: 'authenticitySuggestion', emoji: '🗣️' },
  { label: 'Provocação', key: 'provocation', suggestionKey: 'provocationSuggestion', emoji: '⚡' },
];

function getScoreColor(value: number): string {
  if (value >= 8) return 'bg-green-500';
  if (value >= 6) return 'bg-yellow-500';
  if (value >= 4) return 'bg-orange-500';
  return 'bg-red-500';
}

function getOverallColor(value: number): string {
  if (value >= 8) return 'text-green-500';
  if (value >= 6) return 'text-yellow-500';
  if (value >= 4) return 'text-orange-500';
  return 'text-red-500';
}

interface PostScoreProps {
  score: PostScoreType;
  onGenerateVariation: () => void;
  isGenerating: boolean;
}

export default function PostScore({ score, onGenerateVariation, isGenerating }: PostScoreProps) {
  const overall = Math.round(((score.clarity + score.engagement + score.authenticity + score.provocation) / 4) * 10) / 10;

  return (
    <Card className="border-border bg-card mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">Score do Post</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getOverallColor(overall)}`}>{overall}</span>
            <span className="text-sm text-muted-foreground">/10</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground italic mt-1">{score.overallDiagnosis}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {CRITERIA.map(({ label, key, suggestionKey, emoji }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {emoji} {label}
              </span>
              <span className={`text-sm font-bold ${getOverallColor(score[key])}`}>
                {score[key]}/10
              </span>
            </div>
            <Progress
              value={score[key] * 10}
              className="h-2"
              indicatorClassName={getScoreColor(score[key])}
            />
            <p className="text-xs text-muted-foreground">{score[suggestionKey]}</p>
          </div>
        ))}

        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={onGenerateVariation}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando variação...</>
          ) : (
            <><RefreshCw className="mr-2 h-4 w-4" /> Gerar Variação</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
