import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type DeviceType = 'mobile' | 'laptop' | 'desktop';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleMobileSidebar: () => void;
  deviceType: DeviceType;
  isMobile: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const getDeviceType = (width: number): DeviceType => {
  if (width < 1024) return 'mobile';
  if (width < 1280) return 'laptop';
  return 'desktop';
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => 
    typeof window !== 'undefined' ? getDeviceType(window.innerWidth) : 'desktop'
  );

  const [mobileOpen, setMobileOpen] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved !== null) {
        return saved === "true";
      }
      // Auto-condition: laptop screens (1024px-1279px) default to collapsed mini-bar to maximize work area
      if (typeof window !== 'undefined') {
        const type = getDeviceType(window.innerWidth);
        return type === 'laptop';
      }
      return false;
    } catch {
      return false;
    }
  });

  // Track window resizing and adapt device type & responsive defaults
  useEffect(() => {
    let lastDevice = getDeviceType(window.innerWidth);
    
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const currentDevice = getDeviceType(currentWidth);
      setDeviceType(currentDevice);

      // If transition across device thresholds without saved preference
      if (currentDevice !== lastDevice) {
        lastDevice = currentDevice;
        const saved = localStorage.getItem("sidebar_collapsed");
        if (saved === null) {
          if (currentDevice === 'laptop') {
            setIsCollapsed(true);
          } else if (currentDevice === 'desktop') {
            setIsCollapsed(false);
          }
        }
        if (currentDevice !== 'mobile') {
          setMobileOpen(false);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sidebar_collapsed", String(isCollapsed));
    } catch {
      // ignore
    }
  }, [isCollapsed]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        // don't trigger if typing in an input/textarea
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        if (window.innerWidth < 1024) {
          toggleMobileSidebar();
        } else {
          toggleSidebar();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, toggleMobileSidebar]);

  const isMobile = deviceType === 'mobile';
  const isLaptop = deviceType === 'laptop';
  const isDesktop = deviceType === 'desktop';

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      setIsCollapsed,
      toggleSidebar,
      mobileOpen,
      setMobileOpen,
      toggleMobileSidebar,
      deviceType,
      isMobile,
      isLaptop,
      isDesktop
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within SidebarProvider");
  }
  return context;
};
