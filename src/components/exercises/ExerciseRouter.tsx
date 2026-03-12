import type { Task, TaskResult } from '../../types/curriculum'
import Flashcard from './Flashcard'
import MultipleChoice from './MultipleChoice'
import FillInBlank from './FillInBlank'
import ListenConfirm from './ListenConfirm'

interface Props {
  task: Task
  onComplete: (result: TaskResult) => void
}

export default function ExerciseRouter({ task, onComplete }: Props) {
  switch (task.type) {
    case 'flashcard':
      return <Flashcard task={task} onComplete={onComplete} />
    case 'multiple-choice':
      return <MultipleChoice task={task} onComplete={onComplete} />
    case 'fill-in-blank':
      return <FillInBlank task={task} onComplete={onComplete} />
    case 'listen-confirm':
      return <ListenConfirm task={task} onComplete={onComplete} />
    default:
      return <p className="text-red-400">Unknown exercise type</p>
  }
}
