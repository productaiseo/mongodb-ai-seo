import React, { ReactNode } from 'react';
import Navbar from '@/components/Navs/Navbar';
import Footer from '@/components/Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ 
  children,
}) => {

  return (
      <main className="relative min-h-screen flex flex-col items-center justify-center py-8 bg-gradient-to-b from-blue-950 to-cyan-900 text-white">
            
            <Navbar />
           
              {children}

            <Footer />

      </main>
  );
};

export default Layout;