import { LoginForm } from "@/components/login-form"
import { GalleryVerticalEnd } from "lucide-react"
import { Safari } from "@/components/magicui/safari"

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex lg:grid lg:grid-cols-2">
      <div className="flex-1 flex flex-col bg-[#F8F6F2] dark:bg-gradient-to-br dark:from-slate-950 dark:to-slate-900">
        {/* Logo in top left corner */}
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-[#3A4D6F] to-[#2A3D5F] rounded-lg p-2">
              <GalleryVerticalEnd className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-[#2C2C2C] dark:text-white">CmdShift</span>
          </div>
        </div>
        
        {/* Login form centered */}
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <LoginForm />
        </div>
      </div>
      <div className="hidden lg:flex items-center justify-center relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
        
        <div className="relative p-12 max-w-4xl w-full">
          <Safari
            url="cmdshift.ai"
            className="size-full"
            imageSrc="/cmd-hero-6.svg"
          />
          
          <div className="mt-8 text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Browser-Based AI Development</h2>
            <p className="text-slate-400">Experience the future of coding with CmdShift AI</p>
            
            <div className="flex items-center justify-center space-x-8 text-slate-500 pt-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                </svg>
                <span className="text-sm">Team Collaboration</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm">AI-Powered Coding</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
