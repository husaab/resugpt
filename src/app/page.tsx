import { ResumeForm } from '../components/ResumeForm'
import { BackgroundIcons } from '../components/background-icons'

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <BackgroundIcons />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10">
        <div className="text-center">
          <h1 style={{ color: 'var(--text-primary)' }} className="text-5xl md:text-6xl font-bold mb-6 transition-colors">
            Create Perfect 
            <span style={{ color: 'var(--accent-color)' }}> Resumes</span>
            <br />
            with AI 
          </h1>
          
          <p style={{ color: 'var(--text-primary)' }} className="text-xl mb-10 max-w-3xl mx-auto transition-colors">
            Upload your existing resume and job description to create 
            tailored resumes that get you noticed.
          </p>
        </div>

        <ResumeForm />

        <div className="text-center">
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-body)' }} className="p-6 rounded-lg border transition-colors">
              <div style={{ backgroundColor: 'var(--accent-color)' }} className="w-12 h-12 rounded-lg mb-4 mx-auto flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 style={{ color: 'var(--text-primary)' }} className="text-xl font-semibold mb-3 transition-colors">Upload Your Resume</h3>
              <p style={{ color: 'var(--text-primary)' }} className="transition-colors">
                Simply upload your existing resume in any format. Our AI will analyze and understand your background.
              </p>
            </div>

            <div style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-body)' }} className="p-6 rounded-lg border transition-colors">
              <div style={{ backgroundColor: 'var(--accent-color)' }} className="w-12 h-12 rounded-lg mb-4 mx-auto flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 style={{ color: 'var(--text-primary)' }} className="text-xl font-semibold mb-3 transition-colors">Add Job Details</h3>
              <p style={{ color: 'var(--text-primary)' }} className="transition-colors">
                Paste the job description or requirements. Our AI will identify key skills and requirements to match.
              </p>
            </div>

            <div style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-body)' }} className="p-6 rounded-lg border transition-colors">
              <div style={{ backgroundColor: 'var(--accent-color)' }} className="w-12 h-12 rounded-lg mb-4 mx-auto flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 style={{ color: 'var(--text-primary)' }} className="text-xl font-semibold mb-3 transition-colors">Get AI Results</h3>
              <p style={{ color: 'var(--text-primary)' }} className="transition-colors">
                Receive a tailored resume and cover letter optimized for the specific job opportunity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
