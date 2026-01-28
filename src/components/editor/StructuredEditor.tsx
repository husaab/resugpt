'use client'

import { ResumeData, EducationEntry, ExperienceEntry, ProjectEntry } from '@/types/resume'
import { SectionAccordion } from './SectionAccordion'
import { BulletEditor } from './BulletEditor'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface StructuredEditorProps {
  resumeData: ResumeData
  onChange: (data: ResumeData) => void
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50 focus:border-[var(--accent-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
      />
    </div>
  )
}

export function StructuredEditor({ resumeData, onChange }: StructuredEditorProps) {
  const updateHeader = (field: string, value: string) => {
    onChange({
      ...resumeData,
      header: { ...resumeData.header, [field]: value },
    })
  }

  const updateEducation = (index: number, field: keyof EducationEntry, value: string | string[]) => {
    const newEducation = [...resumeData.education]
    newEducation[index] = { ...newEducation[index], [field]: value }
    onChange({ ...resumeData, education: newEducation })
  }

  const addEducation = () => {
    onChange({
      ...resumeData,
      education: [
        ...resumeData.education,
        { school: '', location: '', degree: '', dates: '', bullets: [] },
      ],
    })
  }

  const removeEducation = (index: number) => {
    onChange({
      ...resumeData,
      education: resumeData.education.filter((_, i) => i !== index),
    })
  }

  const updateExperience = (index: number, field: keyof ExperienceEntry, value: string | string[]) => {
    const newExperience = [...resumeData.experience]
    newExperience[index] = { ...newExperience[index], [field]: value }
    onChange({ ...resumeData, experience: newExperience })
  }

  const addExperience = () => {
    onChange({
      ...resumeData,
      experience: [
        ...resumeData.experience,
        { title: '', company: '', location: '', dates: '', bullets: [] },
      ],
    })
  }

  const removeExperience = (index: number) => {
    onChange({
      ...resumeData,
      experience: resumeData.experience.filter((_, i) => i !== index),
    })
  }

  const updateProject = (index: number, field: keyof ProjectEntry, value: string | string[]) => {
    const newProjects = [...resumeData.projects]
    newProjects[index] = { ...newProjects[index], [field]: value }
    onChange({ ...resumeData, projects: newProjects })
  }

  const addProject = () => {
    onChange({
      ...resumeData,
      projects: [
        ...resumeData.projects,
        { name: '', technologies: '', date: '', bullets: [] },
      ],
    })
  }

  const removeProject = (index: number) => {
    onChange({
      ...resumeData,
      projects: resumeData.projects.filter((_, i) => i !== index),
    })
  }

  const updateSkills = (field: string, value: string) => {
    onChange({
      ...resumeData,
      skills: { ...resumeData.skills, [field]: value },
    })
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <SectionAccordion title="Header">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="sm:col-span-2">
            <InputField
              label="Full Name"
              value={resumeData.header?.name || ''}
              onChange={(v) => updateHeader('name', v)}
              placeholder="John Doe"
            />
          </div>
          <InputField
            label="Phone"
            value={resumeData.header?.phone || ''}
            onChange={(v) => updateHeader('phone', v)}
            placeholder="123-456-7890"
          />
          <InputField
            label="Email"
            value={resumeData.header?.email || ''}
            onChange={(v) => updateHeader('email', v)}
            placeholder="john@example.com"
            type="email"
          />
          <InputField
            label="LinkedIn"
            value={resumeData.header?.linkedin || ''}
            onChange={(v) => updateHeader('linkedin', v)}
            placeholder="linkedin.com/in/johndoe"
          />
          <InputField
            label="GitHub"
            value={resumeData.header?.github || ''}
            onChange={(v) => updateHeader('github', v)}
            placeholder="github.com/johndoe"
          />
          <div className="sm:col-span-2">
            <InputField
              label="Website (optional)"
              value={resumeData.header?.website || ''}
              onChange={(v) => updateHeader('website', v)}
              placeholder="johndoe.com"
            />
          </div>
        </div>
      </SectionAccordion>

      {/* Education Section */}
      <SectionAccordion title="Education">
        {resumeData.education?.map((edu, index) => (
          <div key={index} className="p-3 sm:p-4 border border-[var(--border-color)] rounded-lg space-y-3 sm:space-y-4 relative group">
            <button
              type="button"
              onClick={() => removeEducation(index)}
              className="absolute top-2 right-2 p-1.5 text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
              title="Remove education"
            >
              <TrashIcon className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pr-8 sm:pr-0">
              <InputField
                label="School"
                value={edu.school}
                onChange={(v) => updateEducation(index, 'school', v)}
                placeholder="University Name"
              />
              <InputField
                label="Location"
                value={edu.location}
                onChange={(v) => updateEducation(index, 'location', v)}
                placeholder="City, State"
              />
              <InputField
                label="Degree"
                value={edu.degree}
                onChange={(v) => updateEducation(index, 'degree', v)}
                placeholder="Bachelor of Science in Computer Science"
              />
              <InputField
                label="Dates"
                value={edu.dates}
                onChange={(v) => updateEducation(index, 'dates', v)}
                placeholder="Sep 2020 -- May 2024"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                Achievements/Honors (optional)
              </label>
              <BulletEditor
                bullets={edu.bullets || []}
                onChange={(bullets) => updateEducation(index, 'bullets', bullets)}
                placeholder="Dean's List, GPA, etc."
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addEducation}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-lg transition-colors border border-dashed border-[var(--border-color)] w-full justify-center"
        >
          <PlusIcon className="w-4 h-4" />
          Add Education
        </button>
      </SectionAccordion>

      {/* Experience Section */}
      <SectionAccordion title="Experience">
        {resumeData.experience?.map((exp, index) => (
          <div key={index} className="p-3 sm:p-4 border border-[var(--border-color)] rounded-lg space-y-3 sm:space-y-4 relative group">
            <button
              type="button"
              onClick={() => removeExperience(index)}
              className="absolute top-2 right-2 p-1.5 text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
              title="Remove experience"
            >
              <TrashIcon className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pr-8 sm:pr-0">
              <InputField
                label="Title"
                value={exp.title}
                onChange={(v) => updateExperience(index, 'title', v)}
                placeholder="Software Engineer"
              />
              <InputField
                label="Dates"
                value={exp.dates}
                onChange={(v) => updateExperience(index, 'dates', v)}
                placeholder="Jan 2023 -- Present"
              />
              <InputField
                label="Company"
                value={exp.company}
                onChange={(v) => updateExperience(index, 'company', v)}
                placeholder="Company Name"
              />
              <InputField
                label="Location"
                value={exp.location}
                onChange={(v) => updateExperience(index, 'location', v)}
                placeholder="City, State"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                Bullet Points
              </label>
              <BulletEditor
                bullets={exp.bullets || []}
                onChange={(bullets) => updateExperience(index, 'bullets', bullets)}
                placeholder="Action verb + what you did + impact..."
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addExperience}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-lg transition-colors border border-dashed border-[var(--border-color)] w-full justify-center"
        >
          <PlusIcon className="w-4 h-4" />
          Add Experience
        </button>
      </SectionAccordion>

      {/* Projects Section */}
      <SectionAccordion title="Projects">
        {resumeData.projects?.map((project, index) => (
          <div key={index} className="p-3 sm:p-4 border border-[var(--border-color)] rounded-lg space-y-3 sm:space-y-4 relative group">
            <button
              type="button"
              onClick={() => removeProject(index)}
              className="absolute top-2 right-2 p-1.5 text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error-light)] rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
              title="Remove project"
            >
              <TrashIcon className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pr-8 sm:pr-0">
              <InputField
                label="Project Name"
                value={project.name}
                onChange={(v) => updateProject(index, 'name', v)}
                placeholder="Project Name"
              />
              <InputField
                label="Date"
                value={project.date}
                onChange={(v) => updateProject(index, 'date', v)}
                placeholder="September 2024"
              />
              <div className="sm:col-span-2">
                <InputField
                  label="Technologies"
                  value={project.technologies}
                  onChange={(v) => updateProject(index, 'technologies', v)}
                  placeholder="TypeScript, React, Node.js, PostgreSQL"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                Bullet Points
              </label>
              <BulletEditor
                bullets={project.bullets || []}
                onChange={(bullets) => updateProject(index, 'bullets', bullets)}
                placeholder="What you built and its impact..."
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addProject}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-lg transition-colors border border-dashed border-[var(--border-color)] w-full justify-center"
        >
          <PlusIcon className="w-4 h-4" />
          Add Project
        </button>
      </SectionAccordion>

      {/* Skills Section */}
      <SectionAccordion title="Technical Skills">
        <div className="space-y-4">
          <InputField
            label="Languages"
            value={resumeData.skills?.languages || ''}
            onChange={(v) => updateSkills('languages', v)}
            placeholder="Python, JavaScript, TypeScript, Java, C++"
          />
          <InputField
            label="Frameworks"
            value={resumeData.skills?.frameworks || ''}
            onChange={(v) => updateSkills('frameworks', v)}
            placeholder="React, Next.js, Node.js, Express, Django"
          />
          <InputField
            label="Developer Tools"
            value={resumeData.skills?.tools || ''}
            onChange={(v) => updateSkills('tools', v)}
            placeholder="Git, Docker, AWS, Kubernetes, Linux"
          />
        </div>
      </SectionAccordion>
    </div>
  )
}
