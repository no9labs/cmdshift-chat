import { SignupForm } from "@/components/signup-form"
import { GalleryVerticalEnd } from "lucide-react"
import { Safari } from "@/components/magicui/safari"

export default function SignupPage() {
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
        
        {/* Signup form centered */}
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <SignupForm />
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
            <h2 className="text-2xl font-bold text-white">Join the AI Revolution</h2>
            <p className="text-slate-400">Start building amazing applications with CmdShift AI</p>
            
            <div className="flex items-center justify-center space-x-8 text-slate-500 pt-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
                <span className="text-sm">Growing Community</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm">Advanced AI Models</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
