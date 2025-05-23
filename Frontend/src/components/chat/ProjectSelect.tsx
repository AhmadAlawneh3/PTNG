
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project } from "@/types/project";

interface ProjectSelectProps {
  projects: Project[];
  selectedProject: string | null;
  onProjectSelect: (projectId: string) => void;
}

const ProjectSelect = ({ projects, selectedProject, onProjectSelect }: ProjectSelectProps) => {
  return (
    <Select value={selectedProject || ''} onValueChange={onProjectSelect}>
      <SelectTrigger className="w-full bg-white/5 border-warm-100/30">
        <SelectValue placeholder="Select a project to chat" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((project) => (
          <SelectItem key={project.id} value={String(project.id)}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProjectSelect;
