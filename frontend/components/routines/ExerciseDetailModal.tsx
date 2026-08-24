import { X, Dumbbell, ExternalLink, Play } from "lucide-react";

export interface ExerciseDetail {
  id: string;
  name: string;
  category: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  equipment: string;
  imageUrl?: string | null;
  instructions?: string | null;
  videoUrl?: string | null;
}

interface ExerciseDetailModalProps {
  exercise: ExerciseDetail;
  onClose: () => void;
}

export function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {
  const youtubeUrl =
    exercise.videoUrl ||
    `https://www.youtube.com/results?search_query=how+to+do+${encodeURIComponent(
      exercise.name
    )}+exercise+form+tutorial`;

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center p-0 sm:p-4">
      <div className="flex-1 sm:flex-none w-full max-w-lg bg-surface flex flex-col sm:rounded-2xl overflow-hidden sm:max-h-[90vh] shadow-2xl relative border border-border">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-background/60 backdrop-blur-md rounded-full hover:bg-background transition-colors border border-border/50 text-foreground"
        >
          <X size={18} />
        </button>

        {/* Image Area */}
        <div className="w-full h-60 sm:h-64 bg-background border-b border-border relative flex items-center justify-center p-4 shrink-0 overflow-hidden">
          {exercise.imageUrl ? (
            <img
              src={`/${exercise.imageUrl}`}
              alt={exercise.name}
              className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
            />
          ) : (
            <Dumbbell size={48} className="opacity-20" />
          )}

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface to-transparent pointer-events-none" />

          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground drop-shadow-sm capitalize">
              {exercise.name}
            </h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider rounded-full">
              {exercise.category}
            </span>
            <span className="px-3 py-1 bg-border/60 border border-border text-foreground text-xs font-semibold uppercase tracking-wider rounded-full">
              {exercise.equipment}
            </span>
          </div>

          {/* Video Tutorial CTA Button */}
          <div>
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-xl font-medium text-sm transition-all shadow-md shadow-red-600/20 hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <span>Watch Technique Video on YouTube</span>
              <ExternalLink size={14} className="opacity-80 ml-1" />
            </a>
          </div>

          {/* Muscles Targeted */}
          <section>
            <h3 className="text-xs font-semibold mb-2.5 opacity-60 uppercase tracking-wider">
              Muscles Targeted
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="font-medium text-sm capitalize">
                  {exercise.primaryMuscle} (Primary)
                </span>
              </div>
              {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-0.5 pl-4">
                  {exercise.secondaryMuscles.map((m) => (
                    <span key={m} className="text-xs opacity-70 capitalize bg-border/30 px-2 py-0.5 rounded">
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Instructions */}
          {exercise.instructions && (
            <section>
              <h3 className="text-xs font-semibold mb-2 opacity-60 uppercase tracking-wider">
                Execution Instructions
              </h3>
              <p className="text-sm leading-relaxed opacity-85 whitespace-pre-wrap bg-background/50 p-4 rounded-xl border border-border/40">
                {exercise.instructions}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
