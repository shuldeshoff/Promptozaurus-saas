import MainLayout from '../components/layout/MainLayout';
import Header from '../components/layout/Header';
import { EditorProvider } from '../context/EditorContext';

function DashboardContent() {
  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <Header />
      
      {/* Main Content - Full Width */}
      <main className="flex-1 overflow-hidden">
        <MainLayout />
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <EditorProvider>
      <DashboardContent />
    </EditorProvider>
  );
}

