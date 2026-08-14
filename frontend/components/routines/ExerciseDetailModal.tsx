import { X, Dumbbell } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  category: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  imageUrl?: string;
  instructions?: string;
}

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
}

export function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {
  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col sm:items-center sm:justify-center p-0 sm:p-4">
      <div className="flex-1 sm:flex-none w-full max-w-lg bg-surface flex flex-col sm:rounded-2xl overflow-hidden sm:max-h-[90vh] shadow-2xl relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 bg-background/50 backdrop-blur-md rounded-full hover:bg-background transition-colors"
        >
          <X size={20} />
        </button>

        {/* Image Area */}
        <div className="w-full h-64 sm:h-72 bg-surface border-b border-border relative flex items-center justify-center p-4 shrink-0">
          {exercise.imageUrl ? (
            <img 
              src={`/${exercise.imageUrl}`} 
              alt={exercise.name}
              className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
            />
          ) : (
            <Dumbbell size={48} className="opacity-20" />
          )}
          
          {/* Gradient overlay for text readability (only at the very bottom) */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
          
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground shadow-sm">{exercise.name}</h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider rounded-full">
              {exercise.category}
            </span>
            <span className="px-3 py-1 bg-border border border-border-strong text-foreground text-xs font-semibold uppercase tracking-wider rounded-full">
              {exercise.equipment}
            </span>
          </div>

          {/* Muscles */}
          <section>
            <h3 className="text-sm font-medium mb-3 opacity-70 uppercase tracking-wider">Muscles Targeted</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="font-medium capitalize">{exercise.primaryMuscle} (Primary)</span>
              </div>
              {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-1 pl-5">
                  {exercise.secondaryMuscles.map(m => (
                    <span key={m} className="text-sm opacity-70 capitalize">• {m}</span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Instructions */}
          {exercise.instructions && (
            <section>
              <h3 className="text-sm font-medium mb-3 opacity-70 uppercase tracking-wider">Instructions</h3>
              <p className="text-sm leading-relaxed opacity-90 whitespace-pre-wrap">
                {exercise.instructions}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
