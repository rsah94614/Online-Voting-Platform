import Sidebar from '@/components/dashboard/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      {/* Main content offset by sidebar width */}
      <div className="flex-1 flex flex-col lg:ml-[240px] transition-all duration-300 min-h-screen">
        {children}
      </div>
    </div>
  )
}